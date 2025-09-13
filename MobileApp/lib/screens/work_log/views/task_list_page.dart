import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/services/order_service.dart';
import 'package:soft/services/socket_service.dart';
import 'package:soft/widgets/task_item.dart';

class TaskListPage extends StatefulWidget {
  const TaskListPage({super.key});

  @override
  State<StatefulWidget> createState() => _TaskListPage();
}

class _TaskListPage extends State<TaskListPage> {
  final List<OrderModel> taskList = [];
  bool _isLoading = true;
  int _page = 1;
  final int _limit = 50;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  final OrderService _orderService = OrderService();

  Future<OrderModel?> getCachedOrder() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedOrderString = prefs.getString(
      'cached_order',
    );

    if (cachedOrderString != null) {
      final Map<String, dynamic> jsonMap = jsonDecode(
        cachedOrderString,
      );
      return OrderModel.fromJson(jsonMap);
    }
    return null;
  }

  void loadOrderFromLocal() async {
    final cachedOrder = await getCachedOrder();
    setState(() {
      taskList.clear();
      taskList.addAll(
        cachedOrder != null ? [cachedOrder] : [],
      ); // Nếu không có dữ liệu, giữ danh sách trống
      _isLoading = false;
    });
  }

  void getOrderByUser({bool reset = false}) async {
    if (reset) {
      setState(() {
        _page = 1;
        _hasMore = true;
        taskList.clear();
      });
    }

    if (!_hasMore) return;

    var result = await _orderService.getByUser(
      page: _page,
      limit: _limit,
    );
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
      loadOrderFromLocal();
    } else {
      var data = result['data'];
      setState(() {
        if (reset) {
          taskList.clear();
        }
        taskList.addAll(
          (data as List)
              .map((e) => OrderModel.fromJson(e))
              .toList(),
        );
        _isLoadingMore = false;
        if (data.length < _limit) {
          _hasMore = false; // không còn dữ liệu
        } else {
          _page++;
        }
      });
    }
    setState(() {
      _isLoading = false;
    });
  }

  void getReload() async {
    setState(() {
      _isLoading = true;
    });
    getOrderByUser(reset: true);
  }

  @override
  void initState() {
    super.initState();
    getOrderByUser(reset: true);
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >=
              _scrollController.position.maxScrollExtent -
                  200 &&
          !_isLoadingMore &&
          _hasMore) {
        setState(() {
          _isLoadingMore = true;
        });
        getOrderByUser();
      }
    });
  }

  final ScrollController _scrollController =
      ScrollController();
  @override
  void dispose() {
    super.dispose();
    _scrollController.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Công việc được giao',
          style: TextStyle(color: Colors.white),
        ),
        centerTitle: true,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            onPressed: getReload,
            icon: Icon(
              Icons.replay_outlined,
              color: Colors.white,
            ),
          ),
        ],
      ),
      body: ValueListenableBuilder(
        valueListenable:
            SocketService().notificationNotifier,
        builder: (context, value, _) {
          if (value != null) {
            // Khi có thông báo → reload dữ liệu
            getOrderByUser();
            // Reset notifier để tránh reload liên tục
            WidgetsBinding.instance.addPostFrameCallback((
              _,
            ) {
              SocketService().notificationNotifier.value =
                  null;
            });
          }

          return _isLoading
              ? Center(child: CircularProgressIndicator())
              : taskList.isEmpty
              ? const Center(
                child: Text(
                  'Không có dữ liệu',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                ),
              )
              : ListView.builder(
                itemCount:
                    taskList.length +
                    1, // +1 để hiển thị loading cuối danh sách
                itemBuilder: (context, index) {
                  if (index < taskList.length) {
                    return TaskItem(
                      data: taskList[index],
                    );
                  } else {
                    // Hiện loading khi đang tải thêm
                    return _isLoadingMore
                        ? Center(
                          child:
                              CircularProgressIndicator(),
                        )
                        : SizedBox();
                  }
                },
                controller: _scrollController,
              );
        },
      ),
    );
  }
}
