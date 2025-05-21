import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/services/order_service.dart';

class TaskAssignmentDetail extends StatefulWidget {
  final OrderModel data;
  const TaskAssignmentDetail({
    super.key,
    required this.data,
  });

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentDetail();
}

class _TaskAssignmentDetail
    extends State<TaskAssignmentDetail> {
  bool _isLoading = false;
  final OrderService _orderService = OrderService();

  void deleteOrder() async {
    setState(() {
      _isLoading = true;
    });
    var result = await _orderService.delete(widget.data.id);
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      Navigator.pushNamed(
        context,
        TaskAssignmentRoutes.taskAssignmentList,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.green,
        ),
      );
    }
    setState(() {
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Scaffold(
          appBar: AppBar(
            backgroundColor: Colors.blue,
            automaticallyImplyLeading: false,
            leading: IconButton(
              icon: const Icon(
                Icons.filter_list_rounded,
                color: Colors.white,
              ),
              onPressed: () {
                Navigator.pop(context);
              },
            ),
            title: Text(
              widget.data.taskId.name,
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
                            DateFormat(
                              'dd/MM/yyyy HH:mm:ss',
                            ).format(
                              widget.data.workingDate,
                            ),
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
                            widget.data.createdBy.name ??
                                '', // Điền sau nếu có
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      if (widget.data.deviceId != null)
                        const SizedBox(height: 10),
                      if (widget.data.deviceId != null)
                        Row(
                          children: [
                            Text(
                              'Phương tiện: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              widget.data.deviceId!.name,
                            ), // Điền sau nếu có
                          ],
                        ),
                      if (widget.data.excavatorId != null)
                        const SizedBox(height: 10),
                      if (widget.data.excavatorId != null)
                        Row(
                          children: [
                            Text(
                              'Máy xúc: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              widget.data.excavatorId!.name,
                            ), // Điền sau nếu có
                          ],
                        ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Text(
                            'Số thẻ lương: ',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            "${widget.data.assignedTo.payroll!.code} ${widget.data.assignedTo.name ?? ''}",
                          ), // Điền sau nếu có
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Text(
                                  'Bắt đầu:',
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.w600,
                                  ),
                                ),
                                Text(' '),
                                Text(
                                  widget.data.startTime !=
                                          null
                                      ? DateFormat(
                                        'HH:mm:ss',
                                      ).format(
                                        widget
                                            .data
                                            .startTime!,
                                      )
                                      : '',
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Row(
                              children: [
                                Text(
                                  'Kết thúc:',
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.w600,
                                  ),
                                ),
                                Text(' '),
                                Text(
                                  widget.data.endTime !=
                                          null
                                      ? DateFormat(
                                        'HH:mm:ss',
                                      ).format(
                                        widget
                                            .data
                                            .endTime!,
                                      )
                                      : '',
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Nội dung công việc',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(widget.data.description ?? ''),
                      const SizedBox(height: 10),
                      const Text(
                        'Biện pháp an toàn chung',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        widget
                                .data
                                .taskId
                                .typeId
                                .description ??
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
                child: Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pushNamed(
                            context,
                            TaskAssignmentRoutes
                                .taskAssignmentAdd,
                            arguments: {
                              'task': widget.data.taskId,
                              'order': widget.data,
                            },
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
                          'Copy',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: deleteOrder,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          padding:
                              const EdgeInsets.symmetric(
                                vertical: 15,
                              ),
                        ),
                        child: const Text(
                          'Xóa',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (_isLoading)
          Container(
            color: Colors.black.withOpacity(0.5),
            child: const Center(
              child: CircularProgressIndicator(),
            ),
          ),
      ],
    );
  }
}
