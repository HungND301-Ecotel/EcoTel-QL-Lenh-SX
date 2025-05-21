import 'package:flutter/material.dart';
import 'package:soft/models/order_model.dart';
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

  final OrderService _orderService = OrderService();
  void scanWork() async {
    final action =
        widget.data.startTime == null ? 'start' : 'end';
    var result = await _orderService.scanWork({
      "deviceId": widget.data.deviceId!.id,
      "orderId": widget.data.id,
      "action": action,
    });
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      setState(() {
        widget.data.updateFromJson(result['data']);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            action == 'start'
                ? '✅ Công việc đã bắt đầu'
                : '✅ Công việc đã kết thúc',
          ),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
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
                    if (widget.data.deviceId!.name ==
                        code) {
                      scanWork();
                      await Future.delayed(
                        Duration(seconds: 2),
                      );
                      _controller.stop();
                    } else {
                      ScaffoldMessenger.of(
                        context,
                      ).showSnackBar(
                        SnackBar(
                          content: Text('❌ Quét thất bại!'),
                        ),
                      );
                      await Future.delayed(
                        Duration(seconds: 2),
                      );
                      setState(() => scanned = false);
                      _controller.start();
                    }
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
