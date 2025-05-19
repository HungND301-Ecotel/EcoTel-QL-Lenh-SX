import 'package:flutter/material.dart';
import 'package:job_manager/models/material_model.dart';

class MaterialItem extends StatelessWidget {
  final MaterialModel data;

  const MaterialItem({super.key, required this.data});

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
          Icons.cable_outlined,
          color: Colors.blue,
        ),
        title: Text(data.name),
        trailing: Icon(
          Icons.arrow_forward_ios,
          size: 16,
          color: Colors.grey,
        ),
        onTap: () {},
      ),
    );
  }
}
