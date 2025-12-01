import 'package:flutter/material.dart';

enum SnackType { success, warning, error }

void showCustomDiaLog(
  BuildContext context, {
  required String message,
  SnackType type = SnackType.success,
  int durationSeconds = 3,
}) {
  Color bgColor;
  IconData icon;
  String title;

  switch (type) {
    case SnackType.success:
      bgColor = Colors.green.shade600;
      icon = Icons.check_circle_outline;
      title = "Thành công";
      break;
    case SnackType.warning:
      bgColor = Colors.orange.shade700;
      icon = Icons.warning_amber_rounded;
      title = "Cảnh báo";
      break;
    case SnackType.error:
      bgColor = Colors.red.shade700;
      icon = Icons.error_outline;
      title = "Lỗi";
      break;
  }
  showDialog(
    context: context,
    builder: (context) {
      return AlertDialog(
        titlePadding: const EdgeInsets.all(16),
        contentPadding:
            const EdgeInsets.fromLTRB(16, 0, 16, 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        title: Row(
          children: [
            Icon(icon, color: bgColor, size: 28),
            const SizedBox(width: 12),
            Text(
              title,
              style: TextStyle(
                fontSize: 18,
                color: bgColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Text(
          message,
          style: const TextStyle(
            fontSize: 15,
            height: 1.4,
          ),
        ),
        actions: [
          TextButton(
            child: const Text("Đóng"),
            onPressed: () => Navigator.of(context).pop(),
          )
        ],
      );
    },
  );
}
