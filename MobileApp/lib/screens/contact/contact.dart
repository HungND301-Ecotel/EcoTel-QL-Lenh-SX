import 'package:flutter/material.dart';
import 'package:soft/screens/contact/navigation_controls.dart';
import 'package:soft/screens/contact/web_view_stack.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    final PlatformWebViewControllerCreationParams params =
        const PlatformWebViewControllerCreationParams();

    controller =
        WebViewController.fromPlatformCreationParams(params)
          ..loadRequest(
            Uri.parse('https://ecotel.com.vn/vi/'),
          )
          ..setJavaScriptMode(JavaScriptMode.unrestricted);

    // ✅ Cấu hình riêng cho Android để phát video không cần user chạm
    if (controller.platform is AndroidWebViewController) {
      final androidController =
          controller.platform as AndroidWebViewController;
      androidController.setMediaPlaybackRequiresUserGesture(
        false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Liên hệ',
          style: TextStyle(color: Colors.white),
        ),
        centerTitle: true,
        backgroundColor: Colors.blue,
        iconTheme: IconThemeData(color: Colors.white),
        actions: [
          NavigationControls(controller: controller),
        ],
      ),
      body: WebViewStack(controller: controller),
    );
  }
}
