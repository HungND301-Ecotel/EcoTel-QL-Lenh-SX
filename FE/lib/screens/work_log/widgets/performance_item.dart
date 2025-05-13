import 'package:flutter/material.dart';

class PerformanceItem extends StatelessWidget {
  final Map<String, dynamic> data;

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
        title: Text(data['name']),
        trailing: Text(data['perfomance']),
        onTap: () {},
      ),
    );
  }
}
