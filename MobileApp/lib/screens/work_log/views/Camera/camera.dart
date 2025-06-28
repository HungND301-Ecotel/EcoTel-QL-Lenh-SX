import 'dart:io';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/services/order_service.dart';

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
  void checkin() async {
    if (_imageFile == null) return;
    _showLoadingDialog();

    final position = await Geolocator.getCurrentPosition();

    var result = await _orderService.checkin(
      lat: position.latitude.toString(),
      lng: position.longitude.toString(),
      orderId: widget.data.id,
      file: _imageFile!,
    );
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
          'Check In',
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
            label: Text("Xác nhận Check-in"),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
            ),
          ),
        ],
      ),
    );
  }
}
