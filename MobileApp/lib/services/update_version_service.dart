import 'package:flutter/material.dart';
import 'package:new_version_plus/new_version_plus.dart';

class UpdateVersionService {
  static Future<void> checkForUpdate(
    BuildContext context) async {
    try {
      final newVersion = NewVersionPlus(
        iOSId:
            'com.ecotel.ktv', // đổi thành Bundle ID iOS của bạn
        androidId:
            'com.ecotel.ktv', // đổi thành Package name Android
      );

      final status = await newVersion.getVersionStatus();

      if (status != null && status.canUpdate) {
        newVersion.showUpdateDialog(
          context: context,
          versionStatus: status,
          dialogTitle: 'Có bản cập nhật mới!',
          dialogText:
              'Bạn muốn nâng cấp từ ${status.localVersion} lên ${status.storeVersion} không?',
          updateButtonText: 'Cập nhật',
          dismissButtonText: 'Để sau',
          allowDismissal: true, // ✅ Cho phép user bỏ qua
        );
      }
    } catch (e) {
      debugPrint("❌ Lỗi kiểm tra update: $e");
    }
  }
}
