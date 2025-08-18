import 'package:flutter/material.dart';
import 'package:soft/models/shift_model.dart';
import 'package:soft/services/shift_service.dart';

class ShiftSelect extends StatefulWidget {
  final Function(ShiftModel?) onSelected;
  final ShiftModel? initialShift;
  const ShiftSelect({
    super.key,
    required this.onSelected,
    this.initialShift,
  });

  @override
  State<ShiftSelect> createState() => _ShiftSelectState();
}

class _ShiftSelectState extends State<ShiftSelect> {
  List<ShiftModel> shifts = [];
  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    getShift();
  }

  final ShiftService _shiftService = ShiftService();

  void getShift() async {
    var result = await _shiftService.getAllShift();

    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Có lỗi xảy ra')),
      );
    } else {
      var data = result['data'];

      setState(() {
        shifts.clear();
        shifts.addAll(
          (data as List)
              .map((e) => ShiftModel.fromJson(e))
              .toList(),
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    ShiftModel? selected;
    if (widget.initialShift == null) {
      selected = null;
    } else if (shifts.any(
      (s) => s.id == widget.initialShift!.id,
    )) {
      selected = shifts.firstWhere(
        (s) => s.id == widget.initialShift!.id,
      );
    } else if (shifts.isNotEmpty) {
      selected = shifts.first;
    } else {
      selected = null;
    }
    return SizedBox(
      width: double.infinity,
      child: DropdownButtonFormField(
        value: selected,
        decoration: InputDecoration(
          border: OutlineInputBorder(),
        ),
        items:
            shifts.map((item) {
              return DropdownMenuItem<ShiftModel>(
                value: item,
                child: Text(
                  'Ca ${item.name} (${item.startTime})',
                ),
              );
            }).toList(),
        onChanged: (value) {
          setState(() {
            widget.onSelected(value);
          });
        },
      ),
    );
  }
}
