// lib/screen/setting/version_info_page.dart
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

class VersionInfo extends StatefulWidget {
  const VersionInfo({super.key});

  @override
  State<VersionInfo> createState() => _VersionInfoState();
}

class _VersionInfoState extends State<VersionInfo> {
  PackageInfo? _info;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final info = await PackageInfo.fromPlatform();
    if (!mounted) return;
    setState(() => _info = info);
  }

  @override
  Widget build(BuildContext context) {
    final i = _info;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông tin phiên bản',
            style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.blue,
        centerTitle: true,
        iconTheme: IconThemeData(color: Colors.white),
      ),
      body: i == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              children: [
                const SizedBox(height: 12),
                ListTile(
                  leading: const Icon(Icons.apps),
                  title: const Text('Tên ứng dụng'),
                  subtitle: Text(i.appName),
                ),
                ListTile(
                  leading: const Icon(Icons.code),
                  title: const Text('Package'),
                  subtitle: Text(i.packageName),
                ),
                ListTile(
                  leading: const Icon(Icons.numbers),
                  title: const Text('Phiên bản'),
                  subtitle: Text(
                      '${i.version} (${i.buildNumber})'),
                ),
                // Nếu có BASE_API hoặc flavor, bạn có thể hiển thị thêm ở đây.
              ],
            ),
    );
  }
}
