import 'package:flutter/material.dart';
import 'package:soft/models/department_model.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/services/department_service.dart';

class DepartmentButton extends StatefulWidget {
  final String? department;
  final Function(String) onSelectDepartment;
  const DepartmentButton({
    super.key,
    this.department,
    required this.onSelectDepartment,
  });

  @override
  State<StatefulWidget> createState() =>
      _DepartmentButtonState();
}

class _DepartmentButtonState
    extends State<DepartmentButton> {
  DepartmentModel? _department;

  final DepartmentService _departmentService =
      DepartmentService();

  @override
  void initState() {
    super.initState();
    if (widget.department != null) {
      getDepartment();
    } // Gán giá trị phương tiện ban đầu
  }

  void getDepartment() async {
    var result = await _departmentService.getById(
      widget.department!,
    );
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      var data = result['data'];
      setState(() {
        _department = DepartmentModel.fromJson(data);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: TextButton.icon(
            icon: Icon(Icons.pin),
            onPressed: () async {
              final selectedDepartment = await Navigator.of(
                context,
                rootNavigator: true,
              ).pushNamed(AppRoute.departmentSelect);
              // Nếu có giá trị trả về, cập nhật phòng ban
              if (selectedDepartment != null &&
                  selectedDepartment is DepartmentModel) {
                widget.onSelectDepartment(
                    selectedDepartment.id);
                setState(() {
                  _department =
                      selectedDepartment; // Cập nhật giá trị phòng ban
                });
              }
            },
            style: TextButton.styleFrom(
              foregroundColor: Colors.black,
              backgroundColor: Colors.grey.shade300,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(0),
              ),
              alignment: Alignment.centerLeft,
            ),
            label: Text(_department?.code ??
                'Chọn đơn vị sửa chữa'),
          ),
        ),
      ],
    );
  }
}
