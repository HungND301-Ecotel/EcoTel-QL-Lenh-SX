import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
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
    "Vận hành xe vục vụ":
        WorkLogRoutes.serviceVehicleTripList,
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
      case "Vận hành xe phục vụ":
        return "DS chuyến";
      default:
        return "";
    }
  }

  final OrderService _orderService = OrderService();
  bool _isLoading = true;
  OrderModel? data;
  final _formKey = GlobalKey<FormState>();
  final _noteController = TextEditingController();

  void getOrderByUser() async {
    var result = await _orderService.getbyId(
      widget.orderId,
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
      var dataMap = result['data'];
      final provider = Provider.of<ReportDraftProvider>(
        context,
        listen: false,
      );
      provider.setOrder(OrderModel.fromJson(dataMap));
      setState(() {
        data = OrderModel.fromJson(dataMap);
      });
    }
    setState(() {
      _isLoading = false;
    });
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
      getOrderByUser();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            status == 'start'
                ? 'Hãy Check In để ghi nhận thời gian bắt đầu.'
                : status == 'end'
                ? 'Hãy Check Out để ghi nhận thời gian kết thúc.'
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
    getOrderByUser();
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
          body: Center(child: CircularProgressIndicator()),
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
              if ([
                    'completed',
                    'in_progress',
                  ].contains(data?.status) &&
                  data?.endTime == null)
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
              if ([
                    'completed',
                    'in_progress',
                  ].contains(data?.status) &&
                  data?.endTime == null)
                IconButton(
                  onPressed: () {
                    Navigator.pushNamed(
                      context,
                      WorkLogRoutes.camera,
                      arguments: data,
                    );
                  },
                  icon: Icon(
                    Icons.photo_camera,
                    color: Colors.white,
                    size: 30,
                  ),
                ),
            ],
            title: Text(
              data?.job.name ?? '',
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
                                ).format(data!.workingDate)
                                : '',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        "Ca: ${data?.shift.name} (${data?.shift.startTime})",
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
                            data?.createdBy.fullName ??
                                '', // Điền sau nếu có
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),

                          SizedBox(width: 6),
                          if ((data?.createdBy.phone ?? '')
                              .isNotEmpty)
                            IconButton(
                              onPressed: () {
                                _callPhone(
                                  data!.createdBy.phone!,
                                );
                              },
                              icon: Icon(Icons.phone),
                            ),
                        ],
                      ),
                      if (data
                              ?.devicesToProduce
                              ?.isNotEmpty ??
                          false)
                        const SizedBox(height: 10),
                      if (data
                              ?.devicesToProduce
                              ?.isNotEmpty ??
                          false)
                        Row(
                          children: [
                            Text(
                              'Loại phương tiện: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              (data?.devicesToProduce ?? [])
                                  .map(
                                    (e) =>
                                        '${e.deviceType.name} - Sl:${e.quantity}',
                                  )
                                  .join(', '),
                              softWrap: true,
                              overflow:
                                  TextOverflow.visible,
                            ), // Điền sau nếu có
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
                                fontWeight: FontWeight.w600,
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
                      if (data?.excavator != null)
                        const SizedBox(height: 10),
                      if (data?.excavator != null)
                        Row(
                          children: [
                            Text(
                              'Máy xúc: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Expanded(
                              child: Text(
                                (data!.excavator ?? [])
                                    .map((e) => e.code)
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
                        'Biện pháp an toàn chung',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        data?.safetyMeasure?.content ?? '',
                      ),
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
                    if (['pending'].contains(data?.status))
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
                      ].contains(data?.job.type))
                        ElevatedButton(
                          onPressed: () {
                            Navigator.pushNamed(
                              context,
                              WorkLogRoutes
                                  .addMachineAssistantPage,
                              arguments: data,
                            );
                          },
                          child: const Text('Phụ máy'),
                        ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: () {
                          if ([
                            'Vận hành xe',
                            'Vận hành xúc',
                            'Vận hành khoan',
                            'Vận hành gạt',
                            'Vận hành xe phục vụ',
                          ].contains(data?.job.type)) {
                            if (data!.excavator!.length >
                                1) {
                              Navigator.pushNamed(
                                context,
                                WorkLogRoutes
                                    .directWorkMultiExcavatorReport,
                                arguments: data,
                              );
                              if (data!.startTime == null &&
                                  data?.shiftReport ==
                                      null) {
                                ScaffoldMessenger.of(
                                  context,
                                ).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Bạn đang báo công mà chưa check in',
                                      style: TextStyle(
                                        color: Colors.black,
                                      ),
                                    ),
                                    backgroundColor:
                                        Colors.orange,
                                  ),
                                );
                              }
                            } else {
                              Navigator.pushNamed(
                                context,
                                WorkLogRoutes
                                    .directWorkMultiVehicleReport,
                                arguments: data,
                              );
                              if (data!.startTime == null &&
                                  data?.shiftReport ==
                                      null) {
                                ScaffoldMessenger.of(
                                  context,
                                ).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Bạn đang báo công mà chưa check in',
                                      style: TextStyle(
                                        color: Colors.black,
                                      ),
                                    ),
                                    backgroundColor:
                                        Colors.orange,
                                  ),
                                );
                              }
                            }
                          } else {
                            Navigator.pushNamed(
                              context,
                              WorkLogRoutes
                                  .indirectWorkReport,
                              arguments: data,
                            );
                            if (data!.startTime == null &&
                                data?.shiftReport == null) {
                              ScaffoldMessenger.of(
                                context,
                              ).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Bạn đang báo công mà chưa check in',
                                    style: TextStyle(
                                      color: Colors.black,
                                    ),
                                  ),
                                  backgroundColor:
                                      Colors.orange,
                                ),
                              );
                            }
                          }
                        },
                        child: const Text('Báo công'),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: () {
                          showDialog(
                            context: context,
                            builder:
                                (
                                  dialogContext,
                                ) => AlertDialog(
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
                                              : "Bạn chưa báo công, bạn có muốn kết thúc không?",
                                        ),
                                        if (data?.shiftReport ==
                                            null) ...[
                                          const SizedBox(
                                            height: 8,
                                          ),
                                          const Text(
                                            'Nêu lí do (bắt buộc)*',
                                            style: TextStyle(
                                              color:
                                                  Colors
                                                      .red,
                                            ),
                                          ),
                                          TextFormField(
                                            controller:
                                                _noteController,
                                            validator: (
                                              value,
                                            ) {
                                              if (value ==
                                                      null ||
                                                  value
                                                      .isEmpty) {
                                                return 'Vui lòng nhập lí do';
                                              }
                                              return null;
                                            },
                                            minLines: 3,
                                            maxLines: null,
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed:
                                          () => Navigator.pop(
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
                                            data?.shiftReport !=
                                                    null
                                                ? "end"
                                                : "warning",
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
                        child: const Text('Kết thúc lệnh'),
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
