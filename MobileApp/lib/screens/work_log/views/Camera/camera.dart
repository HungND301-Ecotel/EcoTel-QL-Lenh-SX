import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
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

  void checkin() async {
    if (_imageFile == null) return;
    _showLoadingDialog();

    final compressedWebP = await compressToWebP(
      File(_imageFile!.path),
    );

    final res = await _uploadService.upload(
      compressedWebP,
      "checkin",
    );
    if (res['status'] == "error") {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      final uploadUrl = res['data'];
      final response = await http.put(
        Uri.parse(uploadUrl),
        headers: {
          'Content-Type':
              'image/webp', // đảm bảo đúng MIME type
        },
        body: await compressedWebP.readAsBytes(),
      );

      if (response.statusCode != 200) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Upload thất bại: ${response.statusCode}',
              ),
              backgroundColor: Colors.red,
            ),
          );
        }

        return print("Upload thất bại");
      }
      final position =
          await Geolocator.getCurrentPosition();
      final publicUrl = uploadUrl.split('?')[0];

      var result = await _orderService.checkin({
        'lat': position.latitude.toString(),
        'lng': position.longitude.toString(),
        'orderId': widget.data.id,
        'file': publicUrl,
      });
      if (!mounted) return;
      Navigator.of(context, rootNavigator: true).pop();

      if (result['status'] == 'error') {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message']),
            backgroundColor: Colors.red,
          ),
        );
        await Future.delayed(Duration(seconds: 2));
        setState(() => scanned = false);
      } else {
        setState(() {
          widget.data.updateFromJson(result['data']);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message']),
            backgroundColor: Colors.green,
          ),
        );
        // Navigator.pop(context);
        Navigator.popAndPushNamed(
          context,
          WorkLogRoutes.taskDetailPage,
          arguments: widget.data.id,
        );
        await Future.delayed(Duration(seconds: 2));
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
          widget.data.status == "in_progress"
              ? 'Check Out'
              : 'Check In',
          style: TextStyle(color: Colors.white),
        ),
        iconTheme: IconThemeData(color: Colors.white),
        centerTitle: true,
        backgroundColor: Colors.blue,
      ),
      body: Column(
        children: [
          if (_imageFile != null)
            Image.file(
              File(_imageFile!.path),
              height: 300,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _openCamera,
            icon: Icon(Icons.camera_alt),
            label: Text("Chụp lại ảnh"),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () async {
              if (_imageFile != null) {
                checkin();
              }
            },
            icon: Icon(Icons.check),
            label: Text(
              widget.data.status == "in_progress"
                  ? "Xác nhận Check-Out"
                  : "Xác nhận Check-In",
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
            ),
          ),
        ],
      ),
    );
  }
}
