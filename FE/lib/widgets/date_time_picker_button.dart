import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class DateTimePickerButton extends StatelessWidget {
  final DateTime? selectedDateTime;
  final VoidCallback onPressed;

  const DateTimePickerButton({
    super.key,
    required this.selectedDateTime,
    required this.onPressed,
  });

  String getFormattedDateTime(DateTime? dateTime) {
    if (dateTime == null) return 'Chọn ngày giờ';
    return DateFormat('dd/MM/yyyy HH:mm').format(dateTime);
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
