import 'package:flutter/material.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/services/order_service.dart';
import 'package:soft/services/socket_service.dart';
import 'package:soft/widgets/task_assignment_item.dart';

class TaskAssignmentList extends StatefulWidget {
  const TaskAssignmentList({super.key});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentList();
}

class _TaskAssignmentList
    extends State<TaskAssignmentList> {
  bool _isLoading = true;
  int _page = 1;
  final int _limit = 20;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  final List<OrderModel> tasks = [];
  final OrderService _orderService = OrderService();

  final TextEditingController _searchController =
      TextEditingController();
  String _searchText = '';

  void getAllOrder({bool reset = false}) async {
    if (reset) {
      setState(() {
        _page = 1;
        _hasMore = true;
        tasks.clear();
      });
    }

    if (!_hasMore) return;

    var result = await _orderService.getAllOrder(
      page: _page,
      limit: _limit,
      search: _searchText,
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
        if (reset) {
          tasks.clear();
        }
        tasks.addAll(
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
    getAllOrder(reset: true);
  }

  final ScrollController _scrollController =
      ScrollController();
  @override
  void initState() {
    super.initState();
    getAllOrder(reset: true);

    _scrollController.addListener(() {
      if (_scrollController.position.pixels >=
              _scrollController.position.maxScrollExtent -
                  200 &&
          !_isLoadingMore &&
          _hasMore) {
        setState(() {
          _isLoadingMore = true;
        });
        getAllOrder();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        automaticallyImplyLeading: false,
        leading: IconButton(
          icon: Icon(
            Icons.replay_outlined,
            color: Colors.white,
          ),
          onPressed: getReload,
        ),
        title: Text(
          'Giao việc',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () {
              Navigator.pushNamed(
                context,
                TaskAssignmentRoutes.taskAssignmentType,
              );
            },
            icon: Icon(Icons.add, color: Colors.white),
          ),
        ],
      ),
      body: ValueListenableBuilder(
        valueListenable:
            SocketService().notificationNotifier,
        builder: (context, value, _) {
          if (value != null) {
            // Khi có thông báo → reload dữ liệu
            getAllOrder();
            // Reset notifier để tránh reload liên tục
            WidgetsBinding.instance.addPostFrameCallback((
              _,
            ) {
              SocketService().notificationNotifier.value =
                  null;
            });
          }
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText:
                        'Tìm kiếm thẻ lương, công việc...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        12,
                      ),
                    ),
                    contentPadding:
                        const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                  ),
                  onChanged: (value) {
                    setState(() {
                      _searchText = value;
                      _isLoading = true;
                    });
                    getAllOrder(reset: true);
                  },
                ),
              ),
              Expanded(
                child:
                    _isLoading
                        ? const Center(
                          child:
                              CircularProgressIndicator(),
                        )
                        : tasks.isEmpty
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
                              tasks.length +
                              1, // +1 để hiển thị loading cuối danh sách
                          itemBuilder: (context, index) {
                            if (index < tasks.length) {
                              return TaskAssignItem(
                                data: tasks[index],
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
                        ),
              ),
            ],
          );
        },
      ),
    );
  }
}
