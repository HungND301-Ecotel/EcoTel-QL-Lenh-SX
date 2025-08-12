import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class TimePickerButton extends StatelessWidget {
  final String? selectedDateTime;
  final VoidCallback onPressed;

  const TimePickerButton({
    super.key,
    required this.selectedDateTime,
    required this.onPressed,
  });

  String getFormattedDateTime(String? dateTime) {
    if (dateTime == null || dateTime.isEmpty) {
      return 'Chọn giờ làm';
    }
    return dateTime; // Vì đã chuẩn hóa là HH:mm
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        icon: Icon(Icons.calendar_today),
        onPressed: onPressed,
        style: TextButton.styleFrom(
          foregroundColor: Colors.black,
          backgroundColor: Colors.grey.shade300,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(0),
          ),
          alignment: Alignment.centerLeft,
        ),
        label: Text(getFormattedDateTime(selectedDateTime)),
      ),
    );
  }
}
