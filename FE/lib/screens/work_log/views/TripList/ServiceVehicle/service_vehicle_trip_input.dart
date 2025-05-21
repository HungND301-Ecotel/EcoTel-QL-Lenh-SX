import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/services/report_service.dart';
import 'package:provider/provider.dart';

class ServiceVehicleTripInput extends StatefulWidget {
  const ServiceVehicleTripInput({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ServiceVehicleTripInput();
}

class _ServiceVehicleTripInput
    extends State<ServiceVehicleTripInput> {
  final TextEditingController _quantityController =
      TextEditingController();
  final TextEditingController _distanceKmController =
      TextEditingController();
  final TextEditingController _minuteController =
      TextEditingController();

  final ReportService _reportService = ReportService();
  void create() async {
    final provider = Provider.of<ReportDraftProvider>(
      context,
      listen: false,
    );
    final quantity = int.tryParse(
      _quantityController.text.trim(),
    );
    final distance = num.tryParse(
      _distanceKmController.text.trim(),
    );
    final minute = int.tryParse(
      _quantityController.text.trim(),
    );

    if (quantity == null ||
        distance == null ||
        minute == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Vui lòng nhập đủ thông tin."),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    provider.setVehicleServiceInfo(
      quantity,
      distance,
      minute,
    );
    var result = await _reportService.createReport({
      "orderId": provider.orderId,
      "material": provider.material,
      "fromLocation":provider.fromLocation,
      "toLocation":provider.toLocation,
      "quantity": provider.quantity,
      "distanceKm": provider.distanceKm,
      "workingMinutes": provider.workingMinutes,
    });
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      provider.reset();
      Navigator.pushNamed(
        context,
        WorkLogRoutes.serviceVehicleTripList,
        arguments: provider.orderId,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Số chuyến',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        iconTheme: IconThemeData(color: Colors.white),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  Text(
                    'Số chuyến',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  TextField(
                    controller: _quantityController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter
                          .digitsOnly,
                    ],
                  ),
                  Text(
                    'Nhập km di chuyển',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  TextField(
                    controller: _distanceKmController,
                    keyboardType: TextInputType.number,
                  ),
                  Text(
                    'Giờ sản phẩm (phút)',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  TextField(
                    controller: _minuteController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter
                          .digitsOnly,
                    ],
                  ),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8.0),
            width: double.infinity,
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Về trước'),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder:
                            (
                              BuildContext dialogContext,
                            ) => AlertDialog(
                              title: Text("Xác nhận"),
                              content: Text(
                                "Bạn muốn lưu chuyến vào hệ thống",
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () {
                                    Navigator.of(
                                      dialogContext,
                                    ).pop();
                                  },
                                  style:
                                      TextButton.styleFrom(
                                        foregroundColor:
                                            Colors.blue,
                                      ),
                                  child: Text("Bỏ qua"),
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.of(
                                      dialogContext,
                                    ).pop();
                                    create();
                                  },
                                  style:
                                      TextButton.styleFrom(
                                        foregroundColor:
                                            Colors.blue,
                                      ),
                                  child: Text("Lưu lại"),
                                ),
                              ],
                            ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Ghi lại'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
