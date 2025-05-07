import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:job_manager/routes/assign_job_route.dart';

class AddAssignJob extends StatefulWidget {
  final String name;
  const AddAssignJob({super.key, required this.name});

  @override
  State<StatefulWidget> createState() =>
      _AddAssignJobState();
}

class _AddAssignJobState extends State<AddAssignJob> {
  DateTime? _selectedDateTime;

  String get _formattedDateTime {
    if (_selectedDateTime == null) return 'Chọn ngày giờ';
    return DateFormat(
      'dd/MM/yyyy HH:mm',
    ).format(_selectedDateTime!);
  }

  Future<void> _pickDateTime() async {
    DateTime? date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );

    if (date == null) return;

    TimeOfDay? time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );

    if (time == null) return;

    setState(() {
      _selectedDateTime = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          widget.name,
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        iconTheme: IconThemeData(
          color: Colors.white, // Màu icon trên AppBar
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text.rich(
              TextSpan(
                text: 'Số thẻ lương  ',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.black,
                ),
                children: [
                  TextSpan(
                    text: 'Nguyễn Tuấn Đạt',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
            ),
            TextField(),
            Text('Ngày giờ'),
            SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                icon: Icon(Icons.calendar_today),
                onPressed: _pickDateTime,
                style: TextButton.styleFrom(
                  foregroundColor: Colors.black,
                  backgroundColor: Colors.grey.shade400,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(0),
                  ),
                  alignment: Alignment.centerLeft,
                ),
                label: Text(_formattedDateTime),
              ),
            ),
            Text('Nội dung công việc'),
            TextField(maxLines: null, minLines: 5),
            Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(
                    context,
                    AssignJobRoutes.list_assign_job,
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
                child: Text('Lưu lại'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
