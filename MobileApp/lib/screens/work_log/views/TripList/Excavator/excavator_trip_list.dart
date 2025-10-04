// Danh sách chuyến của máy xúc
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:soft/models/report_model.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/services/report_service.dart';
import 'package:provider/provider.dart';

class ExcavatorTripList extends StatefulWidget {
  final String orderId;
  const ExcavatorTripList({
    super.key,
    required this.orderId,
  });

  @override
  State<StatefulWidget> createState() =>
      _ExcavatorTripList();
}

class _ExcavatorTripList extends State<ExcavatorTripList> {
  @override
  void initState() {
    super.initState();
    getReportByOrder();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<ReportDraftProvider>(
        context,
        listen: false,
      );
      provider.setOrderId(widget.orderId);
    });
  }

  bool _isLoading = true;
  final ReportService _reportService = ReportService();
  final List<ReportModel> _allData = [];
  void getReportByOrder() async {
    var result = await _reportService.getByOrder(
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
      var data = result['data'];
      setState(() {
        _allData
            .clear(); // Nếu cần làm sạch danh sách trước
        _allData.addAll(
          (data as List)
              .map((e) => ReportModel.fromJson(e))
              .toList(),
        );
      });
    }
    setState(() {
      _isLoading = false;
    });
  }

  void addTripTime(int index) async {
    final report = _allData[index];
    var result = await _reportService.addTrip(report.id);

    if (result['status'] == 'success') {
      getReportByOrder();
    }
  }

  void removeTripTime(int index, int timeIndex) async {
    final report = _allData[index];

    var result = await _reportService.removeTrip(
      report.id,
      timeIndex,
    );

    if (result['status'] == 'success') {
      getReportByOrder();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Báo chuyến cho máy xúc',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        iconTheme: IconThemeData(color: Colors.white),
        centerTitle: true,
        automaticallyImplyLeading: false,
        leading: IconButton(
          onPressed: () {
            Navigator.pushNamed(
              context,
              WorkLogRoutes.taskDetailPage,
              arguments: widget.orderId,
            );
          },
          icon: Icon(Icons.arrow_back, color: Colors.white),
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.pushNamed(
                context,
                WorkLogRoutes.excavatorSelectVehicle,
              );
            },
            icon: Icon(Icons.add, color: Colors.white),
          ),
        ],
      ),
      body: Column(
        children: [
          // HEADER
          Container(
            color: Colors.grey[300],
            padding: const EdgeInsets.symmetric(
              vertical: 8,
              horizontal: 16,
            ),
            child: Row(
              children: const [
                Expanded(
                  flex: 2,
                  child: Text(
                    "Phương tiện",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  flex: 2,
                  child: Text(
                    "Vật liệu",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                SizedBox(width: 8),
                Text(
                  "Số chuyến",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                SizedBox(width: 40), // chừa chỗ cho nút +
              ],
            ),
          ),
          const Divider(height: 1),
          // DANH SÁCH
          Expanded(
            child: ListView.builder(
              itemCount: _allData.length,
              itemBuilder: (context, index) {
                final item = _allData[index];
                final times =
                    item.quantityUpdateTimes ?? [];

                return Card(
                  child: ExpansionTile(
                    trailing: SizedBox.shrink(),
                    showTrailingIcon: false,
                    tilePadding:
                        EdgeInsets
                            .zero, // Xoá padding trái/phải
                    childrenPadding: EdgeInsets.zero,
                    title: Row(
                      children: [
                        Expanded(
                          child: Text(
                            item.device?.code ?? "",
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            item.material?.name ?? "",
                            style: const TextStyle(
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          "${times.length}",
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.add,
                            color: Colors.green,
                          ),
                          onPressed:
                              () => addTripTime(index),
                        ),
                      ],
                    ),
                    children: [
                      ...times.asMap().entries.map((entry) {
                        final timeIndex = entry.key;
                        final timeValue = entry.value;
                        return ListTile(
                          dense: true,
                          title: Text(
                            DateFormat(
                              'dd/MM/yyyy HH:mm:ss',
                            ).format(timeValue),
                          ),
                          trailing: IconButton(
                            icon: const Icon(
                              Icons.close,
                              color: Colors.red,
                            ),
                            onPressed:
                                () => removeTripTime(
                                  index,
                                  timeIndex,
                                ),
                          ),
                        );
                      }),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
