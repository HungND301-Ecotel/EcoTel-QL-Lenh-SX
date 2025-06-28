import 'package:flutter/material.dart';
import 'package:soft/models/location_model.dart';

class LocationItem extends StatelessWidget {
  final LocationModel data;
  final VoidCallback? onTap;
  final bool selected;

  const LocationItem({
    super.key,
    required this.data,
    this.selected = false,
    this.onTap,
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
          selected
              ? Icons.radio_button_checked
              : Icons.radio_button_off_rounded,
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
