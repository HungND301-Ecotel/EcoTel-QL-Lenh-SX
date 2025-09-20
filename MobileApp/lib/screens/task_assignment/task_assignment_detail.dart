import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/services/order_service.dart';
import 'package:url_launcher/url_launcher.dart';

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
  @override
  void initState() {
    // TODO: implement initState
    super.initState();
  }

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
              widget.data.job?.name ?? '',
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
                            widget.data.workingDate != null
                                ? DateFormat(
                                  'dd/MM/yyyy',
                                ).format(
                                  widget.data.workingDate!,
                                )
                                : '',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        "Ca: ${widget.data.shift?.name ?? ''} (${(widget.data.shiftHour != '' ? widget.data.shiftHour : widget.data.shift?.startTime) ?? ''})",
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
                            widget
                                    .data
                                    .createdBy
                                    ?.fullName ??
                                '', // Điền sau nếu có
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          SizedBox(width: 6),
                          if (widget
                                  .data
                                  .createdBy
                                  ?.phone !=
                              null)
                            IconButton(
                              onPressed: () {
                                final phone =
                                    widget
                                        .data
                                        .createdBy!
                                        .phone!;
                                _callPhone(phone);
                              },
                              icon: const Icon(Icons.phone),
                            ),
                        ],
                      ),
                      if (widget.data.device != null &&
                          widget.data.device!.isNotEmpty)
                        const SizedBox(height: 10),
                      if (widget.data.device != null &&
                          widget.data.device!.isNotEmpty)
                        Row(
                          children: [
                            Text(
                              'Phương tiện: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              (widget.data.device ?? [])
                                  .map((e) => e.code)
                                  .join(', '),
                              softWrap: true,
                              overflow:
                                  TextOverflow.visible,
                            ), // Điền sau nếu có
                          ],
                        ),
                      if (widget.data.repairVehicles != null &&
                          widget.data.repairVehicles!.isNotEmpty)
                        Text(
                          'Phương tiện sửa chữa: ',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      if (widget.data.repairVehicles != null &&
                          widget.data.repairVehicles!.isNotEmpty)
                        Column(
                          children:
                              widget.data.repairVehicles!.map((
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
                                              color:
                                                  Colors
                                                      .orange,
                                              size: 20,
                                            ),
                                            Text(
                                              repair
                                                      .device
                                                      ?.code ??
                                                  '',
                                            ),
                                          ],
                                        ),
                                        Row(
                                          children: [
                                            Text(
                                              'Tình trạng:  ',
                                              style: TextStyle(
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
                      if (widget
                              .data
                              .excavator
                              ?.isNotEmpty ==
                          true)
                        const SizedBox(height: 10),
                      if (widget
                              .data
                              .excavator
                              ?.isNotEmpty ==
                          true)
                        Row(
                          children: [
                            Text(
                              'Máy xúc: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              (widget.data.excavator ?? [])
                                  .map((e) => e.code)
                                  .join(', '),
                              softWrap: true,
                              overflow:
                                  TextOverflow.visible,
                            ), // Điền sau nếu có
                          ],
                        ),
                      if (widget
                              .data
                              .material
                              ?.isNotEmpty ==
                          true)
                        const SizedBox(height: 10),
                      if (widget
                              .data
                              .material
                              ?.isNotEmpty ==
                          true)
                        Row(
                          children: [
                            Text(
                              'Vật liệu: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Expanded(
                              child: Text(
                                (widget.data.material ?? [])
                                    .map((e) => e.name)
                                    .join(', '),
                                softWrap: true,
                                overflow:
                                    TextOverflow.visible,
                              ),
                            ), // Điền sau nếu có
                          ],
                        ),
                      if (widget
                              .data
                              .location
                              ?.isNotEmpty ==
                          true)
                        const SizedBox(height: 10),
                      if (widget
                              .data
                              .location
                              ?.isNotEmpty ==
                          true)
                        Row(
                          children: [
                            Text(
                              'Điểm đổ: ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Expanded(
                              child: Text(
                                (widget.data.location ?? [])
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
                      Row(
                        children: [
                          Text(
                            'Số thẻ lương: ',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            "${widget.data.assignedTo.salaryCode} ${widget.data.assignedTo.fullName ?? ''}",
                          ),
                          SizedBox(width: 6),
                          if ((widget
                                      .data
                                      .assignedTo
                                      .phone ??
                                  '')
                              .isNotEmpty)
                            IconButton(
                              onPressed: () {
                                _callPhone(
                                  widget
                                      .data
                                      .assignedTo
                                      .phone!,
                                );
                              },
                              icon: Icon(Icons.phone),
                            ),
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
                      Text(widget.data.workContent ?? ''),
                      if (widget
                          .data
                          .safetyMeasureSpecific!
                          .isNotEmpty)
                        if (widget
                            .data
                            .safetyMeasureSpecific!
                            .isNotEmpty)
                          const Text(
                            'Biện pháp an toàn cụ thể',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                      Text(
                        widget.data.safetyMeasureSpecific ??
                            '',
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Biện pháp an toàn chung',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(widget.data.safetyMeasure ?? ''),
                    ],
                  ),
                ),
              ),
              if (widget.data.status == "completed")
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pushNamed(
                        context,
                        TaskAssignmentRoutes
                            .taskAssignmentTransfer,
                        arguments: {
                          'task': widget.data.job,
                          'order': widget.data,
                        },
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        vertical: 15,
                      ),
                    ),
                    child: const Text(
                      'Chuyển giao ca',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
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
                              'task': widget.data.job,
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
