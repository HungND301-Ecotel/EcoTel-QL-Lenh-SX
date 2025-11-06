import 'package:flutter/material.dart';

/// 🌀 Widget dialog hiển thị khi đang đồng bộ dữ liệu
class SyncLoadingDialog extends StatelessWidget {
  final String message;

  const SyncLoadingDialog({
    super.key,
    this.message = 'Đang báo chuyến...',
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.black.withOpacity(0.75),
      insetPadding: const EdgeInsets.symmetric(horizontal: 80),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Colors.white),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
