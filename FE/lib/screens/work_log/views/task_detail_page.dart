import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';

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

  @override
  Widget build(BuildContext context) {
    final selectedType = widget.data['type'];
    final route = typeToRoute[selectedType];
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          widget.data['title'] ?? '',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        iconTheme: IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.pushNamed(
                context,
                WorkLogRoutes.qrCode,
                arguments: widget.data,
              );
            },
            icon: Icon(
              Icons.qr_code_scanner_outlined,
              size: 25,
              color: Colors.white,
            ),
          ),
        ],
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
                        widget.data['time'] ?? '',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: const [
                      Text(
                        'Người giao: ',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        '', // Điền sau nếu có
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: const [
                      Text(
                        'Số thẻ lương: ',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(''), // Điền sau nếu có
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
                widget.data['status'] == 'Chưa nhận lệnh'
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
                    : widget.data['status'] ==
                        'Đã nhận lệnh'
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
                              if (widget.data['category'] ==
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
