import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/services/order_service.dart';

class TaskDetailPage extends StatefulWidget {
  final Map<String, dynamic> data;
  const TaskDetailPage({super.key, required this.data});

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
  void update() async {
    var result = await _orderService.update(
      widget.data['_id'],
      {'status': 'accepted'},
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
      setState(() {
        widget.data['status'] = 'accepted';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Công việc đã bắt đầu'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedType =
        widget.data['taskId']?['typeId']?['name'];
    final route = typeToRoute[selectedType];
    return Scaffold(
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
        title: Text(
          widget.data['taskId']?['name'] ?? '',
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
                        widget.data['start_time'] != null
                            ? DateFormat(
                              'dd/MM/yyyy HH:mm:ss',
                            ).format(
                              DateTime.parse(
                                widget.data['start_time'],
                              ).toLocal(),
                            )
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
                        widget.data['createdBy']?['name'] ??
                            '', // Điền sau nếu có
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  if (widget.data['deviceId'] != null)
                    const SizedBox(height: 10),
                  if (widget.data['deviceId'] != null)
                    Row(
                      children: [
                        Text(
                          'Phương tiện: ',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          widget.data['deviceId']?['name'] ??
                              '',
                        ), // Điền sau nếu có
                      ],
                    ),
                  if (widget.data['excavatorId'] != null)
                    const SizedBox(height: 10),
                  if (widget.data['excavatorId'] != null)
                    Row(
                      children: [
                        Text(
                          'Máy xúc: ',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          widget.data['excavatorId']?['name'] ??
                              '',
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
                  Text(widget.data['description'] ?? ''),
                  const SizedBox(height: 10),
                  const Text(
                    'Biện pháp an toàn chung',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(widget.data['description'] ?? ''),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8.0),
            width: double.infinity,
            color: Colors.white,
            child:
                widget.data['status'] == 'pending'
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
                                          FontWeight.w600,
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
                                        update();
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
                    : widget.data['status'] == 'accepted'
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
                                  selectedType,
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
                              if (widget
                                      .data['taskId']?['typeId']?['mode'] ==
                                  'trực tiếp') {
                                Navigator.pushNamed(
                                  context,
                                  WorkLogRoutes
                                      .directWorkReport,
                                );
                              } else {
                                Navigator.pushNamed(
                                  context,
                                  WorkLogRoutes
                                      .indirectWorkReport,
                                );
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                              foregroundColor: Colors.white,
                              padding:
                                  const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                            ),
                            child: const Text(
                              'Báo công',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
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
                                                Colors.blue,
                                          ),
                                          child: Text(
                                            "Bỏ qua",
                                          ),
                                        ),
                                        TextButton(
                                          onPressed: () {
                                            Navigator.of(
                                              dialogContext,
                                            ).pop();
                                            Navigator.pushNamed(
                                              context,
                                              WorkLogRoutes
                                                  .taskListPage,
                                            );
                                          },
                                          style: TextButton.styleFrom(
                                            foregroundColor:
                                                Colors.blue,
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
                              backgroundColor: Colors.blue,
                              foregroundColor: Colors.white,
                              padding:
                                  const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                            ),
                            child: const Text(
                              'Kết thúc',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
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
