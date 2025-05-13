import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QrCode extends StatefulWidget {
  final Map<String, dynamic> data;
  const QrCode({super.key, required this.data});

  @override
  State<QrCode> createState() => _QrCodeState();
}

class _QrCodeState extends State<QrCode> {
  final MobileScannerController _controller =
      MobileScannerController();
  bool scanned = false;

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
                    // _controller.stop();

                    if (widget.data['sign'] == code) {
                      ScaffoldMessenger.of(
                        context,
                      ).showSnackBar(
                        SnackBar(
                          content: Text(
                            '✅ Quét đúng mã: $code',
                          ),
                        ),
                      );
                      await Future.delayed(
                        Duration(seconds: 2),
                      );
                      _controller.stop();

                      if (mounted) Navigator.pop(context);
                    } else {
                      ScaffoldMessenger.of(
                        context,
                      ).showSnackBar(
                        SnackBar(
                          content: Text(
                            '❌ Mã không chính xác: $code',
                          ),
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
          Expanded(
            flex: 1,
            child: Center(
              child: Text(
                scanned
                    ? '✅ Quét thành công'
                    : 'Đang chờ quét...',
                style: TextStyle(fontSize: 18),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
