import 'package:flutter/material.dart';
import 'package:job_manager/models/report_model.dart';

class PerformanceItem extends StatelessWidget {
  final ReportModel data;

  const PerformanceItem({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: Colors.grey.shade300,
          ), // Viền trên
          bottom: BorderSide(
            color: Colors.grey.shade300,
          ), // Viền dưới
        ),
      ),
      child: ListTile(
        leading: Icon(
          Icons.hub_outlined,
          color: Colors.blue,
        ),
        title: Text(data.material?.name ?? ''),
        trailing:
            data.drillDepth != null
                ? Text("${data.drillDepth} mks")
                : Text("${data.workingMinutes} phút"),
        onTap: () {},
      ),
    );
  }
}
