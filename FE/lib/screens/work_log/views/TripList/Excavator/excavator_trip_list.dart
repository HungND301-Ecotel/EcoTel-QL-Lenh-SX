// Danh sách chuyến của máy xúc
import 'package:flutter/material.dart';
import 'package:soft/models/report_model.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/excavator_trip_item.dart';
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
      body:
          _isLoading
              ? Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                child: Column(
                  children:
                      _allData
                          .map(
                            (item) => ExcavatorTripItem(
                              data: item,
                            ),
                          )
                          .toList(),
                ),
              ),
    );
  }
}
