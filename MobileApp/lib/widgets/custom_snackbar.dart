import 'package:flutter/material.dart';

enum SnackType { success, warning, error }

void showCustomSnackBar(
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

  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      backgroundColor: bgColor,
      duration: Duration(seconds: durationSeconds),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
      ),
      content: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              "$title: $message",
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    ),
  );
}
