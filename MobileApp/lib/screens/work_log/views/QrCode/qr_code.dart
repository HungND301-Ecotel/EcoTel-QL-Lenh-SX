import 'package:flutter/material.dart';
// import 'package:geolocator/geolocator.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/services/order_service.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QrCode extends StatefulWidget {
  final OrderModel data;
  const QrCode({super.key, required this.data});

  @override
  State<QrCode> createState() => _QrCodeState();
}

class _QrCodeState extends State<QrCode> {
  final MobileScannerController _controller =
      MobileScannerController();
  bool scanned = false;

  @override
  void initState() {
    super.initState();
    // _determinePosition(); // Gọi hàm lấy vị trí tại đây
  }

  // Future<void> _determinePosition() async {
  //   LocationPermission permission;

  //   permission = await Geolocator.checkPermission();
  //   if (permission == LocationPermission.denied) {
  //     permission = await Geolocator.requestPermission();
  //   }
  //   if (permission == LocationPermission.deniedForever) {
  //     return;
  //   }
  // }

  final OrderService _orderService = OrderService();
  void scanWork(String deviceId) async {
    // final position = await Geolocator.getCurrentPosition();
    var result = await _orderService.scanWork({
      "deviceId": deviceId,
      "deviceCode":
          (widget.data.device?.isNotEmpty ?? false)
              ? widget.data.device!.last.code
              : null,
      "lat": 0,
      "lng": 0,
      "orderId": widget.data.id,
    });
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
      await Future.delayed(Duration(seconds: 2));
      setState(() => scanned = false);
      _controller.start();
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
      _controller.stop();
    }
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
          Expanded(
            flex: 4,
            child: MobileScanner(
              controller: _controller,
              onDetect: (barcodeCapture) async {
                if (!scanned &&
                    barcodeCapture.barcodes.isNotEmpty) {
                  final String? code =
                      barcodeCapture
                          .barcodes
                          .first
                          .rawValue;
                  if (code != null) {
                    setState(() => scanned = true);
                    scanWork(code);
                  }
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}
