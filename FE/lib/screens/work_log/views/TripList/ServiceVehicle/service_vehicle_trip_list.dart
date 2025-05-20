import 'package:flutter/material.dart';
import 'package:job_manager/models/report_model.dart';
import 'package:job_manager/providers/report_provider.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/service_vehicle_trip_item.dart';
import 'package:job_manager/services/report_service.dart';
import 'package:provider/provider.dart';

class ServiceVehicleTripList extends StatefulWidget {
  final String orderId;
  const ServiceVehicleTripList({
    super.key,
    required this.orderId,
  });

  @override
  State<StatefulWidget> createState() =>
      _ServiceVehicleTripList();
}

class _ServiceVehicleTripList
    extends State<ServiceVehicleTripList> {
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
          'Báo chuyến xe phục vụ',
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
                WorkLogRoutes
                    .serviceVehicleSelectStartPoint,
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
                            (item) =>
                                ServiceVehicleTripItem(
                                  data: item,
                                ),
                          )
                          .toList(),
                ),
              ),
    );
  }
}
