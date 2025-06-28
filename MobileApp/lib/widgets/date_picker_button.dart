import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class DatePickerButton extends StatelessWidget {
  final DateTime? selectedDateTime;
  final VoidCallback onPressed;

  const DatePickerButton({
    super.key,
    this.selectedDateTime,
    required this.onPressed,
  });

  String getFormattedDateTime(DateTime? dateTime) {
    if (dateTime == null) return 'Ngày';
    return DateFormat('dd/MM/yyyy').format(dateTime);
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
