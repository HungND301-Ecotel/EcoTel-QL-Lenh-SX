import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:path/path.dart' as path;
import 'package:soft/models/order_model.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/services/order_service.dart';
import 'package:soft/services/upload_service.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';

class Camera extends StatefulWidget {
  final OrderModel data;
  const Camera({super.key, required this.data});

  @override
  State<Camera> createState() => _Camera();
}

class _Camera extends State<Camera> {
  final ImagePicker _picker = ImagePicker();
  XFile? _imageFile;
  bool scanned = false;
  DateTime? _checkinTime;

  @override
  void initState() {
    super.initState();
    _determinePosition(); // Gọi hàm lấy vị trí tại đây
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _openCamera();
    });
  }

  Future<void> _openCamera() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
      );
      if (photo != null) {
        setState(() {
          _imageFile = photo;
          _checkinTime = DateTime.now();
        });
      }
    } catch (e) {
      print("Camera error: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không thể mở camera')),
      );
    }
  }

  Future<void> _determinePosition() async {
    LocationPermission permission;

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) {
      return;
    }
  }

  // lưu ảnh vào bộ nhớ tạm thời
  // và lưu thời gian chụp vào file text
  // để có thể lấy lại sau này
  Future<void> saveImageLocally() async {
    if (_imageFile == null) return;

    try {
      final dir = await getTemporaryDirectory();
      final savedImagePath = path.join(
        dir.path,
        "saved_checkin_image.jpg",
      );
      final timestampPath = path.join(
        dir.path,
        "saved_checkin_time.txt",
      );

      await File(_imageFile!.path).copy(savedImagePath);

      final now = DateTime.now().toIso8601String();
      await File(timestampPath).writeAsString(now);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Lỗi khi lưu ảnh: $e")),
      );
    }
  }

  final OrderService _orderService = OrderService();
  final UploadService _uploadService = UploadService();
  Future<File> compressToWebP(File file) async {
    final dir = await getTemporaryDirectory();
    final targetPath = path.join(
      dir.path,
      "${DateTime.now().millisecondsSinceEpoch}.webp",
    );

    final result =
        await FlutterImageCompress.compressAndGetFile(
          file.absolute.path,
          targetPath,
          format: CompressFormat.webp,
          quality: 80,
          minWidth: 300,
          minHeight: 300,
        );

    if (result == null) {
      throw Exception("Không thể nén ảnh WebP");
    }
    return File(result.path);
  }

  void handleCheckinCheckout() async {
    if (_imageFile == null) return;

    if (widget.data.status == "in_progress" &&
        widget.data.shiftReport == null) {
      await saveImageLocally();

      Navigator.popAndPushNamed(
        context,
        WorkLogRoutes.taskDetailPage,
        arguments: widget.data.id,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("xác nhận checkin thành công"),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (widget.data.status == "completed") {
      _showLoadingDialog();

      try {
        // Compress ảnh Check-Out hiện tại
        final checkoutFile = await compressToWebP(
          File(_imageFile!.path),
        );

        // Khởi tạo biến checkin
        String? publicCheckinUrl;
        DateTime? checkinTime;

        // Kiểm tra file check-in có tồn tại không
        final dir = await getTemporaryDirectory();
        final savedImagePath = path.join(
          dir.path,
          "saved_checkin_image.jpg",
        );
        final timestampPath = path.join(
          dir.path,
          "saved_checkin_time.txt",
        );

        if (await File(savedImagePath).exists()) {
          final checkinFile = await compressToWebP(
            File(savedImagePath),
          );

          // Upload Check-In
          final uploadCheckin = await _uploadService.upload(
            checkinFile,
            "checkin",
          );
          if (uploadCheckin['status'] != "error") {
            publicCheckinUrl =
                uploadCheckin['data'].split('?')[0];
            await http.put(
              Uri.parse(uploadCheckin['data']),
              headers: {'Content-Type': 'image/webp'},
              body: await checkinFile.readAsBytes(),
            );
          }

          // Đọc thời gian checkin nếu có
          if (await File(timestampPath).exists()) {
            final checkinTimeString =
                await File(timestampPath).readAsString();
            checkinTime = DateTime.tryParse(
              checkinTimeString,
            );
          }
        }

        // Upload Check-Out
        final uploadCheckout = await _uploadService.upload(
          checkoutFile,
          "checkin",
        );
        if (uploadCheckout['status'] == "error") {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                "Lỗi xử lý: ${uploadCheckout['message']}",
              ),
              backgroundColor: Colors.red,
            ),
          );
        }

        final publicCheckoutUrl =
            uploadCheckout['data'].split('?')[0];
        await http.put(
          Uri.parse(uploadCheckout['data']),
          headers: {'Content-Type': 'image/webp'},
          body: await checkoutFile.readAsBytes(),
        );

        // Gửi dữ liệu API
        final position =
            await Geolocator.getCurrentPosition();
        final result = await _orderService.checkin({
          'lat': position.latitude.toString(),
          'lng': position.longitude.toString(),
          'orderId': widget.data.id,
          if (publicCheckinUrl != null)
            'checkinFile': publicCheckinUrl,
          if (checkinTime != null)
            'checkinTime': checkinTime.toIso8601String(),
          'checkoutFile': publicCheckoutUrl,
          'checkoutTime': DateTime.now().toIso8601String(),
        });

        Navigator.of(context, rootNavigator: true).pop();

        if (result['status'] == 'error') {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message']),
              backgroundColor: Colors.red,
            ),
          );
        } else {
          // Xóa file tạm nếu tồn tại
          try {
            final savedImageFile = File(savedImagePath);
            final timestampFile = File(timestampPath);
            if (await savedImageFile.exists()) {
              await savedImageFile.delete();
            }
            if (await timestampFile.exists()) {
              await timestampFile.delete();
            }
          } catch (e) {
            print("Không thể xóa file tạm: $e");
          }

          widget.data.updateFromJson(result['data']);
          Navigator.popAndPushNamed(
            context,
            WorkLogRoutes.taskDetailPage,
            arguments: widget.data.id,
          );
        }
      } catch (e) {
        Navigator.of(context, rootNavigator: true).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Lỗi xử lý: $e"),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _showLoadingDialog() async {
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          content: Row(
            children: const [
              CircularProgressIndicator(),
              SizedBox(width: 20),
              Text("Đang xử lý..."),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.data.status == "completed"
              ? 'Check Out'
              : 'Check In',
          style: TextStyle(color: Colors.white),
        ),
        iconTheme: IconThemeData(color: Colors.white),
        centerTitle: true,
        backgroundColor: Colors.blue,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_imageFile != null) ...[
            Image.file(
              File(_imageFile!.path),
              height: 300,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
            const SizedBox(height: 8),
            if (_checkinTime != null)
              Center(
                child: Text(
                  'Thời gian: ${DateFormat('dd/MM/yyyy HH:mm:ss').format(_checkinTime!)}',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[700],
                  ),
                ),
              ),
          ],
          const SizedBox(height: 24),

          ElevatedButton.icon(
            onPressed: _openCamera,
            icon: Icon(Icons.camera_alt_outlined),
            label: Text("Chụp ảnh mới"),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blueAccent,
              padding: EdgeInsets.symmetric(vertical: 14),
              textStyle: TextStyle(fontSize: 16),
            ),
          ),
          const SizedBox(height: 16),

          ElevatedButton.icon(
            onPressed: () async {
              if (_imageFile != null) {
                handleCheckinCheckout();
              }
            },
            icon: Icon(Icons.check_circle_outline),
            label: Text(
              widget.data.status == "completed"
                  ? "Xác nhận Check-Out"
                  : "Xác nhận Check-In",
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              padding: EdgeInsets.symmetric(vertical: 16),
              textStyle: TextStyle(fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }
}
