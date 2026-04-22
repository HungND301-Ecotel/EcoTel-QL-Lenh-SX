import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/services/order_service.dart';
import 'package:url_launcher/url_launcher.dart';

class TaskDetailPage extends StatefulWidget {
  final String orderId;
  const TaskDetailPage({super.key, required this.orderId});

  @override
  State<StatefulWidget> createState() => _TaskDetailPage();
}

class _TaskDetailPage extends State<TaskDetailPage> {
  final typeToRoute = {
    "Vận hành xe": WorkLogRoutes.vehicleTripList,
    "Vận hành xúc": WorkLogRoutes.excavatorTripList,
    "Vận hành khoan": WorkLogRoutes.drillingProductList,
    "Vận hành gạt": WorkLogRoutes.dozerProductList,
    // "Vận hành xe phục vụ":
    //     WorkLogRoutes.serviceVehicleTripList,
  };
  String getActionLabel(String type) {
    switch (type) {
      case "Vận hành khoan":
        return "Sản lượng";
      case "Vận hành gạt":
        return "Sản lượng";
      case "Vận hành xe":
        return "DS chuyến";
      case "Vận hành xúc":
        return "DS chuyến";
      // case "Vận hành xe phục vụ":
      //   return "DS chuyến";
      default:
        return "";
    }
  }

  final OrderService _orderService = OrderService();
  bool _isLoading = true;
  OrderModel? data;
  final _formKey = GlobalKey<FormState>();
  final _noteController = TextEditingController();

  Future<void> loadOrderFromCache() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedOrderString = prefs.getString(
      'cached_order',
    );
    if (cachedOrderString != null) {
      final Map<String, dynamic> jsonMap = jsonDecode(
        cachedOrderString,
      );
      final cachedOrder = OrderModel.fromJson(jsonMap);
      final provider = Provider.of<ReportDraftProvider>(
        context,
        listen: false,
      );
      provider.setOrder(cachedOrder);

      setState(() {
        data = cachedOrder;
        _isLoading = false;
      });
    }
  }

  void saveOrderLocally(OrderModel order) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      'cached_order',
      jsonEncode(order.toJson()),
    );
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Lưu dữ liệu vào bộ nhớ tạm thành công',
        ),
        backgroundColor: Colors.green,
      ),
    );
  }

  Future<OrderModel?> getOrderByUser() async {
    var result = await _orderService.getbyId(
      widget.orderId,
    );
    if (!mounted) return null;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
      setState(() {
        _isLoading = false;
      });
      return null;
    } else {
      var dataMap = result['data'];
      final order = OrderModel.fromJson(dataMap);
      final provider = Provider.of<ReportDraftProvider>(
        context,
        listen: false,
      );
      provider.setOrder(order);
      setState(() {
        data = order;
        _isLoading = false;
      });
      return order;
    }
  }

  void update(status) async {
    final note = _noteController.text.trim();
    final Map<String, dynamic> body = {
      'temporaryError': note,
    };

    if (status == "warning") {
      body['status'] = "warning";
    } else if (status == "end") {
      body['status'] = 'completed';
    } else if (status == "start") {
      body['status'] = 'in_progress';
    }
    var result = await _orderService.update(
      widget.orderId,
      body,
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
      final updatedOrder = await getOrderByUser();
      if (status == 'start' && updatedOrder != null) {
        saveOrderLocally(updatedOrder);
      }
      if (status == 'end' || status == 'warning') {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('cached_order');
        print('🧹 Đã xóa cached_order');
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            status == 'start'
                ? 'Công việc đã bắt đầu'
                : status == 'end'
                    ? 'Công việc đã kết thúc'
                    : 'Báo lỗi thành công',
          ),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  @override
  void initState() {
    super.initState();
    loadOrderFromCache().then((_) {
      getOrderByUser();
    });
  }

  void _callPhone(String phoneNumber) async {
    //tao url
    final Uri phoneUri = Uri(
      scheme: 'tel',
      path: phoneNumber,
    );
    // kiểm tra ứng dụng hỗ trợ gọi điện
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri); // gọi tới sdt
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không thể gọi '),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return _isLoading
        ? Scaffold(
            body:
                Center(child: CircularProgressIndicator()),
          )
        : Scaffold(
            appBar: AppBar(
              backgroundColor: Colors.blue,
              automaticallyImplyLeading: false,
              leading: IconButton(
                icon: const Icon(
                  Icons.filter_list_rounded,
                  color: Colors.white,
                ),
                onPressed: () {
                  Navigator.pushNamed(
                    context,
                    WorkLogRoutes.taskListPage,
                  );
                },
              ),
              actions: [
                if (![
                  'pending',
                  'warning',
                ].contains(data?.status))
                  IconButton(
                    onPressed: () {
                      Navigator.pushNamed(
                        context,
                        WorkLogRoutes.qrCode,
                        arguments: data,
                      );
                    },
                    icon: Icon(
                      Icons.qr_code_scanner_outlined,
                      color: Colors.white,
                      size: 30,
                    ),
                  ),
                // if (![
                //   'pending',
                //   'warning',
                // ].contains(data?.status))
                //   IconButton(
                //     onPressed: () {
                //       Navigator.pushNamed(
                //         context,
                //         WorkLogRoutes.camera,
                //         arguments: data,
                //       );
                //     },
                //     icon: Icon(
                //       Icons.photo_camera,
                //       color: Colors.white,
                //       size: 30,
                //     ),
                //   ),
              ],
              title: Text(
                data!.job?.name ?? '',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              centerTitle: true,
            ),
            body: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(8.0),
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'Ngày: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              data?.workingDate != null
                                  ? DateFormat(
                                      'dd/MM/yyyy',
                                    ).format(
                                      data!.workingDate!)
                                  : '',
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          "Ca: ${data?.shift?.name ?? ''} (${(data?.shiftHour != '' ? data?.shiftHour : data?.shift?.startTime) ?? ''})",
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Text(
                              'Người giao: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              data?.createdBy?.fullName ??
                                  '', // Điền sau nếu có
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            SizedBox(width: 6),
                            if ((data?.createdBy?.phone ??
                                    '')
                                .isNotEmpty)
                              IconButton(
                                onPressed: () {
                                  _callPhone(
                                    data!.createdBy!.phone!,
                                  );
                                },
                                icon: Icon(Icons.phone),
                              ),
                          ],
                        ),
                        if (data?.device != null &&
                            data!.device!.isNotEmpty)
                          const SizedBox(height: 10),
                        if (data?.device != null &&
                            data!.device!.isNotEmpty)
                          Row(
                            children: [
                              Text(
                                'Phương tiện: ',
                                style: TextStyle(
                                  fontWeight:
                                      FontWeight.w600,
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  (data!.device ?? [])
                                      .map((e) => e.code)
                                      .join(', '),
                                  softWrap: true,
                                  overflow:
                                      TextOverflow.visible,
                                ),
                              ), // Điền sau nếu có
                            ],
                          ),
                        if (data?.repairVehicles != null &&
                            data!
                                .repairVehicles!.isNotEmpty)
                          Text(
                            'Phương tiện sửa chữa: ',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        if (data?.repairVehicles != null &&
                            data!
                                .repairVehicles!.isNotEmpty)
                          Column(
                            children:
                                data!.repairVehicles!.map((
                              repair,
                            ) {
                              return Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment
                                        .start,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment
                                            .start,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.build,
                                            color: Colors
                                                .orange,
                                            size: 20,
                                          ),
                                          Text(
                                            repair.device
                                                    ?.code ??
                                                '',
                                          ),
                                        ],
                                      ),
                                      Row(
                                        children: [
                                          Text(
                                            'Tình trạng:  ',
                                            style:
                                                TextStyle(
                                              fontWeight:
                                                  FontWeight
                                                      .w600,
                                            ),
                                          ),
                                          Text(
                                            '${repair.note}',
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
                              );
                            }).toList(),
                          ),
                        if (data?.assignedVehicles
                                ?.isNotEmpty ==
                            true)
                          const SizedBox(height: 10),
                        if (data?.assignedVehicles
                                ?.isNotEmpty ==
                            true)
                          Row(
                            children: [
                              Text(
                                'Phương tiện nhận tải: ',
                                style: TextStyle(
                                  fontWeight:
                                      FontWeight.w600,
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  (data!.assignedVehicles ??
                                          [])
                                      .map((e) => e.code)
                                      .join(', '),
                                  softWrap: true,
                                  overflow:
                                      TextOverflow.visible,
                                ),
                              ), // Điền sau nếu có
                            ],
                          ),
                        if (data?.excavator?.isNotEmpty ==
                            true)
                          const SizedBox(height: 10),
                        if (data?.excavator?.isNotEmpty ==
                            true)
                          Row(
                            children: [
                              Text(
                                'Máy xúc: ',
                                style: TextStyle(
                                  fontWeight:
                                      FontWeight.w600,
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  (data!.excavator ?? [])
                                      .where((i) =>
                                          i.status == true)
                                      .map((e) =>
                                          e.device?.code)
                                      .join(', '),
                                  softWrap: true,
                                  overflow:
                                      TextOverflow.visible,
                                ),
                              ), // Điền sau nếu có
                            ],
                          ),
                        if (data?.material?.isNotEmpty ==
                            true)
                          const SizedBox(height: 10),
                        if (data?.material?.isNotEmpty ==
                            true)
                          Row(
                            children: [
                              Text(
                                'Vật liệu: ',
                                style: TextStyle(
                                  fontWeight:
                                      FontWeight.w600,
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  (data!.material ?? [])
                                      .map((e) => e.name)
                                      .join(', '),
                                  softWrap: true,
                                  overflow:
                                      TextOverflow.visible,
                                ),
                              ), // Điền sau nếu có
                            ],
                          ),
                        if (data?.location?.isNotEmpty ==
                            true)
                          const SizedBox(height: 10),
                        if (data?.location?.isNotEmpty ==
                            true)
                          Row(
                            children: [
                              Text(
                                'Điểm đổ: ',
                                style: TextStyle(
                                  fontWeight:
                                      FontWeight.w600,
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  (data!.location ?? [])
                                      .map((e) => e.name)
                                      .join(', '),
                                  softWrap: true,
                                  overflow:
                                      TextOverflow.visible,
                                ),
                              ), // Điền sau nếu có
                            ],
                          ),
                        const SizedBox(height: 10),
                        const Text(
                          'Nội dung công việc',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(data?.workContent ?? ''),
                        const SizedBox(height: 10),
                        const Text(
                          'Biện pháp an toàn cụ thể',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          data?.safetyMeasureSpecific ?? '',
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Biện pháp an toàn chung',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(data?.safetyMeasure ?? ''),
                        const SizedBox(height: 10),
                        if (data?.note != null &&
                            data!.note!.isNotEmpty)
                          const Text(
                            'Nội dung bàn giao ca',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        Text(data?.note ?? ''),
                      ],
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8.0),
                  width: double.infinity,
                  color: Colors.white,
                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment.stretch,
                    children: [
                      // Nếu chưa nhận lệnh
                      if (['pending']
                          .contains(data?.status))
                        ElevatedButton(
                          onPressed: () {
                            update("start");
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                            padding:
                                const EdgeInsets.symmetric(
                              vertical: 15,
                            ),
                          ),
                          child: const Text(
                            'Nhận lệnh',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),

                      // Nếu chưa hoàn thành hoặc lỗi => hiển thị các nút hành động
                      if (![
                        'pending',
                        'completed',
                        'warning',
                      ].contains(data?.status)) ...[
                        const SizedBox(height: 8),
                        if ([
                          'Vận hành xúc',
                          'Vận hành khoan',
                          'Vận hành gạt',
                          'Vận hành xe',
                          'Sửa chữa, bảo dưỡng',
                        ].contains(data!.job?.type))
                          ElevatedButton(
                            onPressed: () {
                              Navigator.pushNamed(
                                context,
                                WorkLogRoutes
                                    .addMachineAssistantPage,
                                arguments: data,
                              );
                            },
                            child: Text(
                              data!.job?.type ==
                                      "Vận hành xe"
                                  ? "Lái xe bổ túc"
                                  : data!.job?.type ==
                                          "Sửa chữa, bảo dưỡng"
                                      ? 'Phụ sửa chữa'
                                      : 'Phụ máy',
                            ),
                          ),
                        const SizedBox(height: 8),
                        if (typeToRoute.containsKey(
                          data!.job?.type,
                        ))
                          ElevatedButton(
                            onPressed: () {
                              Navigator.pushNamed(
                                context,
                                typeToRoute[
                                    data!.job?.type]!,
                                arguments: data?.id,
                              );
                            },
                            child: Text(
                              getActionLabel(
                                  data!.job!.type),
                            ),
                          ),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: () {
                            if ([
                              'vận hành khoan'
                                  .toLowerCase(),
                              'vận hành gạt'.toLowerCase(),
                              'vận hành xe'.toLowerCase(),
                              'vận hành xúc'.toLowerCase(),
                              'vận hành xe phục vụ'
                                  .toLowerCase(),
                            ].contains(
                              data!.job?.type.toLowerCase(),
                            )) {
                              Navigator.pushNamed(
                                context,
                                WorkLogRoutes
                                    .directWorkReport,
                                arguments: data,
                              );
                            } else if ([
                              'sửa chữa, bảo dưỡng'
                                  .toLowerCase(),
                            ].contains(
                              data!.job?.type.toLowerCase(),
                            )) {
                              Navigator.pushNamed(
                                context,
                                WorkLogRoutes
                                    .maintencetWorkReport,
                                arguments: data,
                              );
                            } else {
                              Navigator.pushNamed(
                                context,
                                WorkLogRoutes
                                    .indirectWorkReport,
                                arguments: data,
                              );
                            }
                          },
                          child: const Text('Báo công'),
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (
                                dialogContext,
                              ) =>
                                  AlertDialog(
                                title: const Text(
                                  "Xác nhận",
                                ),
                                content: Form(
                                  key: _formKey,
                                  child: Column(
                                    mainAxisSize:
                                        MainAxisSize.min,
                                    children: [
                                      Text(
                                        data?.shiftReport !=
                                                null
                                            ? "Bạn muốn kết thúc công việc"
                                            : "Bạn chưa báo công, bạn vẫn muốn tiếp tục kết thúc công việc?",
                                      ),
                                      // if (data?.shiftReport ==
                                      //     null) ...[
                                      //   const SizedBox(
                                      //     height: 8,
                                      //   ),
                                      //   const Text(
                                      //     'Nêu lí do (bắt buộc)*',
                                      //     style: TextStyle(
                                      //       color:
                                      //           Colors.red,
                                      //     ),
                                      //   ),
                                      //   TextFormField(
                                      //     controller:
                                      //         _noteController,
                                      //     validator: (
                                      //       value,
                                      //     ) {
                                      //       if (value ==
                                      //               null ||
                                      //           value
                                      //               .isEmpty) {
                                      //         return 'Vui lòng nhập lí do';
                                      //       }
                                      //       return null;
                                      //     },
                                      //     minLines: 3,
                                      //     maxLines: null,
                                      //   ),
                                      // ],
                                    ],
                                  ),
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(
                                      dialogContext,
                                    ),
                                    child: const Text(
                                      "Bỏ qua",
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: () {
                                      if (_formKey
                                          .currentState!
                                          .validate()) {
                                        update(
                                          "end",
                                        );
                                        Navigator.pop(
                                          dialogContext,
                                        );
                                      }
                                    },
                                    child: const Text(
                                      "Kết thúc lệnh",
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                          child:
                              const Text('Kết thúc lệnh'),
                        ),
                      ],

                      // Nếu đã hoàn thành hoặc lỗi
                      if ([
                        "completed",
                        "warning",
                      ].contains(data?.status)) ...[
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                            padding:
                                const EdgeInsets.symmetric(
                              vertical: 15,
                            ),
                          ),
                          child: Text(
                            data?.status == "warning"
                                ? "Lỗi"
                                : "Đã kết thúc",
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          );
  }
}
