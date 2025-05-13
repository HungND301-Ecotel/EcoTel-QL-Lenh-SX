import 'package:flutter/material.dart';

class ExcavatorItem extends StatelessWidget {
  final Map<String, dynamic> data;

  const ExcavatorItem({super.key, required this.data});

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
          Icons.radio_button_checked,
          color: Colors.grey,
        ),
        title: Text(data['name']),
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
