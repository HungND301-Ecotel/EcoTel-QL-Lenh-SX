import 'package:flutter/material.dart';
import 'package:soft/models/device_model.dart';

class ExcavatorItem extends StatelessWidget {
  final DeviceModel data;
  final VoidCallback? onTap;
  final bool selected;

  const ExcavatorItem({
    super.key,
    required this.data,
    this.onTap,
    this.selected = false,
  });

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
          color: selected ? Colors.blue : Colors.grey,
        ),
        title: Text(
          data.name,
          style: TextStyle(
            color: selected ? Colors.blue : Colors.black,
            fontWeight:
                selected
                    ? FontWeight.bold
                    : FontWeight.normal,
          ),
        ),
        trailing: Icon(
          Icons.arrow_forward_ios,
          size: 16,
          color: selected ? Colors.blue : Colors.grey,
        ),
        onTap: onTap,
      ),
    );
  }
}
