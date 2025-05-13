import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:job_manager/routes/task_assignment_route.dart';

class TaskAssignmentAdd extends StatefulWidget {
  final String name;
  const TaskAssignmentAdd({super.key, required this.name});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentAdd();
}

class _TaskAssignmentAdd extends State<TaskAssignmentAdd> {
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
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  Text.rich(
                    TextSpan(
                      text: 'Số thẻ lương  ',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
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
                  Text(
                    'Ngày giờ',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton.icon(
                      icon: Icon(Icons.calendar_today),
                      onPressed: _pickDateTime,
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.black,
                        backgroundColor:
                            Colors.grey.shade300,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(0),
                        ),
                        alignment: Alignment.centerLeft,
                      ),
                      label: Text(_formattedDateTime),
                    ),
                  ),
                  Text(
                    'Phương tiện',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton.icon(
                      icon: Icon(Icons.pin),
                      onPressed: () {
                        Navigator.pushNamed(
                          context,
                          TaskAssignmentRoutes
                              .taskAssignmentVehicleSelect,
                        );
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.black,
                        backgroundColor:
                            Colors.grey.shade300,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(0),
                        ),
                        alignment: Alignment.centerLeft,
                      ),
                      label: Text('Phương tiện'),
                    ),
                  ),
                  Text(
                    'Máy xúc',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton.icon(
                      icon: Icon(Icons.pin),
                      onPressed: () {
                        Navigator.pushNamed(
                          context,
                          TaskAssignmentRoutes
                              .taskAssignmentVehicleSelect,
                        );
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.black,
                        backgroundColor:
                            Colors.grey.shade300,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(0),
                        ),
                        alignment: Alignment.centerLeft,
                      ),
                      label: Text('Máy xúc'),
                    ),
                  ),
                  Text(
                    'Bãi thải',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton.icon(
                      icon: Icon(Icons.casino_sharp),
                      onPressed: () {
                        Navigator.pushNamed(
                          context,
                          TaskAssignmentRoutes
                              .taskAssignmentDumpSiteSelect,
                        );
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.black,
                        backgroundColor:
                            Colors.grey.shade300,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(0),
                        ),
                        alignment: Alignment.centerLeft,
                      ),
                      label: Text('Bãi thải'),
                    ),
                  ),
                  Text(
                    'Chủng loại',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton.icon(
                      icon: Icon(Icons.group_work_outlined),
                      onPressed: () {
                        Navigator.pushNamed(
                          context,
                          TaskAssignmentRoutes
                              .taskAssignmentMaterialSelect,
                        );
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.black,
                        backgroundColor:
                            Colors.grey.shade300,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(0),
                        ),
                        alignment: Alignment.centerLeft,
                      ),
                      label: Text('Chủng loại'),
                    ),
                  ),
                  Text(
                    'Nội dung công việc',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextField(maxLines: null, minLines: 5),
                ],
              ),
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(
                  context,
                  TaskAssignmentRoutes.taskAssignmentList,
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
    );
  }
}
