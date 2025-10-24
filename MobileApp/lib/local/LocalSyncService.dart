import 'package:hive/hive.dart';

class LocalSyncService {
  /// 🔁 Đồng bộ dữ liệu Hive với dữ liệu từ server ///
  /// - Xoá dữ liệu local nếu server không còn ///
  /// - Cập nhật hoặc thêm dữ liệu mới
  Future<void> syncHive<T>({
    required Box<T> box,
    required List<dynamic> data,
    required String prefix,
    required T Function(Map<String, dynamic>) fromJson,
  }) async {
    final serverIds =
        data.map((e) => e['_id'].toString()).toSet();
    final localKeys = box.keys
        .where((k) => k is String && k.startsWith(prefix))
        .cast<String>()
        .toList();
    final localIds = localKeys
        .map((k) => k.replaceFirst(prefix, ''))
        .toSet();
    final deletedIds = localIds.difference(serverIds);
    if (deletedIds.isNotEmpty) {
      final deleteKeys =
          deletedIds.map((id) => '$prefix$id').toList();
      await box.deleteAll(deleteKeys);
      print(
          '🗑️ Đã xoá ${deleteKeys.length} item [$prefix]');
    }
    for (var item in data) {
      final obj = fromJson(item);
      await box.put('$prefix${item['_id']}', obj);
    }
    print('✅ Đồng bộ ${data.length} item [$prefix]');
  }

  Future<void> putIfNotExists<T>({
    required Box<T> box,
    required String id,
    required bool Function(T item) condition,
    required T data,
  }) async {
    final exists = box.values.any(condition);
    if (!exists) {
      await box.put(id, data);
    }
  }
}
