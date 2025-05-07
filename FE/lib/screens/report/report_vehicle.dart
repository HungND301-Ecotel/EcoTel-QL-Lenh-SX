import 'package:flutter/material.dart';

class ReportVehicle extends StatelessWidget {
  const ReportVehicle({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        automaticallyImplyLeading: false,
        leading: IconButton(
          icon: const Icon(Icons.filter_list_rounded),
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
      body: SingleChildScrollView(),
    );
  }
}
