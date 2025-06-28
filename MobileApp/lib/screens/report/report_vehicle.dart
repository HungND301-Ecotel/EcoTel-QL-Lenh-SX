import 'package:flutter/material.dart';
import 'package:soft/widgets/date_picker_button.dart';
import 'package:soft/widgets/vehicle_button.dart';

class ReportVehicle extends StatefulWidget {
  const ReportVehicle({super.key});

  @override
  State<StatefulWidget> createState() => _Reportvehicle();
}

class _Reportvehicle extends State<ReportVehicle> {
  String? _vehicle;
  DateTime? _selectedStartDate;
  DateTime? _selectedEndDate;

  @override
  void initState() {
    super.initState();
    _selectedStartDate = DateTime.now();
    _selectedEndDate = DateTime.now();
  }

  Future<void> _pickStartDate() async {
    DateTime? date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );

    if (date == null) return;


    setState(() {
      _selectedStartDate = date;
    });
  }

  Future<void> _pickEndDate() async {
    DateTime? date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );

    if (date == null) return;

    setState(() {
      _selectedEndDate = date;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        automaticallyImplyLeading: false,
        leading: IconButton(
          icon: const Icon(
            Icons.filter_list_rounded,
            color: Colors.white,
          ),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
        title: Text(
          'Báo cáo lịch sử xe chạy',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          children: [
            VehicleButton(
              onSelectVehicle: (selected) {
                setState(() {
                  _vehicle = selected;
                });
              },
            ),
            Row(
              children: [
                Expanded(
                  child: DatePickerButton(
                    selectedDateTime: _selectedStartDate,
                    onPressed: _pickStartDate,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: DatePickerButton(
                    selectedDateTime: _selectedEndDate,
                    onPressed: _pickEndDate,
                  ),
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () {},
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: Colors.blue,
                  ),
                  icon: Icon(Icons.search),
                  label: Text("Xem"),
                ),
              ],
            ),
            Divider(),
          ],
        ),
      ),
    );
  }
}
