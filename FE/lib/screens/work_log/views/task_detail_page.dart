import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:soft/models/order_model.dart';
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
    "Vận hành xe phục vụ":
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
      setState(() {
        data = OrderModel.fromJson(dataMap);
      });
    }
    setState(() {
      _isLoading = false;
    });
  }

  void update(status) async {
    var result = await _orderService.update(
      widget.orderId,
      {
        'status':
            status == "start" ? 'accepted' : "completed",
      },
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
                ? 'Công việc đã bắt đầu'
                : 'Công việc đã hoàn thành',
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
    final selectedType = data?.taskId.typeId.name;
    final route = typeToRoute[selectedType];
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
              if (data?.status == 'accepted')
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
            ],
            title: Text(
              data?.taskId.name ?? '',
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
                                  'dd/MM/yyyy HH:mm:ss',
                                ).format(data!.workingDate)
                                : '',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
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
                            data?.createdBy.name ??
                                '', // Điền sau nếu có
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),

                          SizedBox(width: 6),
                          if (data?.createdBy.phone != null)
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
                      if (data?.deviceId != null)
                        const SizedBox(height: 10),
                      if (data?.deviceId != null)
                        Row(
                          children: [
                            Text(
                              'Phương tiện: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              data!.deviceId!.name,
                            ), // Điền sau nếu có
                          ],
                        ),
                      if (data?.excavatorId != null)
                        const SizedBox(height: 10),
                      if (data?.excavatorId != null)
                        Row(
                          children: [
                            Text(
                              'Máy xúc: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              data!.excavatorId!.name,
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
                      Text(data?.description ?? ''),
                      const SizedBox(height: 10),
                      const Text(
                        'Biện pháp an toàn chung',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        data?.taskId.typeId.description ??
                            '',
                      ),
                    ],
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8.0),
                width: double.infinity,
                color: Colors.white,
                child:
                    data?.status == 'pending'
                        ? SizedBox(
                          child: ElevatedButton(
                            onPressed: () {
                              showDialog(
                                context: context,
                                builder:
                                    (
                                      BuildContext context,
                                    ) => AlertDialog(
                                      title: const Text(
                                        'Xác nhận',
                                        style: TextStyle(
                                          fontWeight:
                                              FontWeight
                                                  .w600,
                                        ),
                                      ),
                                      content: const Text(
                                        'Bạn đồng ý bắt đầu công việc?',
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed: () {
                                            Navigator.pop(
                                              context,
                                            );
                                          },
                                          child: const Text(
                                            'Bỏ qua',
                                          ),
                                        ),
                                        TextButton(
                                          onPressed: () {
                                            update("start");
                                            Navigator.pop(
                                              context,
                                            );
                                          },
                                          child: const Text(
                                            'Bắt đầu',
                                          ),
                                        ),
                                      ],
                                    ),
                              );
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
                              'Bắt đầu',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        )
                        : data?.status == 'accepted'
                        ? Row(
                          children: [
                            if (route != null &&
                                selectedType !=
                                    "Vận hành xe phục vụ")
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () {
                                    Navigator.pushNamed(
                                      context,
                                      WorkLogRoutes
                                          .addMachineAssistantPage,
                                      arguments: data,
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor:
                                        Colors.blue,
                                    foregroundColor:
                                        Colors.white,
                                    padding:
                                        const EdgeInsets.symmetric(
                                          vertical: 14,
                                        ),
                                  ),
                                  child: const Text(
                                    'Phụ máy',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight:
                                          FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            if (route != null)
                              const SizedBox(width: 8),
                            if (route != null)
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () {
                                    Navigator.pushNamed(
                                      context,
                                      route,
                                      arguments:
                                          widget.orderId,
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor:
                                        Colors.blue,
                                    foregroundColor:
                                        Colors.white,
                                    padding:
                                        const EdgeInsets.symmetric(
                                          vertical: 14,
                                        ),
                                  ),
                                  child: Text(
                                    getActionLabel(
                                      selectedType!,
                                    ),
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight:
                                          FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            if (route != null)
                              const SizedBox(width: 8),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () {
                                  if (data
                                          ?.taskId
                                          .typeId
                                          .mode ==
                                      'trực tiếp') {
                                    Navigator.pushNamed(
                                      context,
                                      WorkLogRoutes
                                          .directWorkReport,
                                      arguments:
                                          widget.orderId,
                                    );
                                  } else {
                                    Navigator.pushNamed(
                                      context,
                                      WorkLogRoutes
                                          .indirectWorkReport,
                                      arguments:
                                          widget.orderId,
                                    );
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor:
                                      Colors.blue,
                                  foregroundColor:
                                      Colors.white,
                                  padding:
                                      const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                ),
                                child: const Text(
                                  'Báo công',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight:
                                        FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () {
                                  showDialog(
                                    context: context,
                                    builder:
                                        (
                                          BuildContext
                                          dialogContext,
                                        ) => AlertDialog(
                                          title: Text(
                                            "Xác nhận",
                                          ),
                                          content: Text(
                                            "Bạn muốn kết thúc công việc",
                                          ),
                                          actions: [
                                            TextButton(
                                              onPressed: () {
                                                Navigator.of(
                                                  dialogContext,
                                                ).pop();
                                              },
                                              style: TextButton.styleFrom(
                                                foregroundColor:
                                                    Colors
                                                        .blue,
                                              ),
                                              child: Text(
                                                "Bỏ qua",
                                              ),
                                            ),
                                            TextButton(
                                              onPressed: () {
                                                update(
                                                  "end",
                                                );
                                                Navigator.of(
                                                  dialogContext,
                                                ).pop();
                                              },
                                              style: TextButton.styleFrom(
                                                foregroundColor:
                                                    Colors
                                                        .blue,
                                              ),
                                              child: Text(
                                                "Kết thúc",
                                              ),
                                            ),
                                          ],
                                        ),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor:
                                      Colors.blue,
                                  foregroundColor:
                                      Colors.white,
                                  padding:
                                      const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                ),
                                child: const Text(
                                  'Kết thúc',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight:
                                        FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        )
                        : SizedBox(
                          child: ElevatedButton(
                            onPressed: null,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                              foregroundColor: Colors.white,
                              padding:
                                  const EdgeInsets.symmetric(
                                    vertical: 15,
                                  ),
                            ),
                            child: const Text(
                              'Đã hoàn thành',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
              ),
            ],
          ),
        );
  }
}
