export const languages = [
  {
    code: 'en',
    name: 'English',
    description: 'English language',
    content: {
      dashboard_nav: 'Dashboard',
      user_nav: 'User',
      server_nav: 'Server',
      site_nav: 'Site',
      product_nav: 'Product',
      blog_nav: 'Blog',
      language_nav: 'Language',
      //
      login_button: 'Log in',
      signup_button: 'Sign up',
      register_button: 'Register',
      connect_server_button: 'Connect',
      logout_button: 'Logout',
      submit_button: 'Submit',
      cancel_button: 'Cancel',
      save_button: 'Save',
      delete_button: 'Delete',
      update_button: 'Update',
      create_button: 'Create',
      detail_button: 'Detail',
      save_changes_button: 'Save Changes',
      need_help_button: 'Need help',

      new_user_button: 'New User',
      new_site_button: 'New Site',
      new_server_button: 'New Server',
      new_product_button: 'New Product',
      new_blog_button: 'New BLog',
      //
      dashboard_page: 'Dashboard',
      server_list_page: 'Server',
      user_list_page: 'User',
      site_list_page: 'Site',
      language_list_page: 'Language',
      product_list_page: 'Product',
      blog_list_page: 'Blog',

      server_detail_page: 'Server Detail',
      user_detail_page: 'User Detail',
      site_detail_page: 'Site Detail',
      product_detail_page: 'Product Detail',
      blog_detail_page: 'Blog Detail',
      //
      home_menu: 'Home',
      profile_menu: 'Profile',
      settings_menu: 'Settings',
      //
      language_table_title: 'Languages',
      user_table_title: 'Users',
      site_table_title: 'Sites',
      server_table_title: 'Servers',
      product_table_title: 'Products',
      blog_table_title: 'Blogs',

      language_detail_title: 'Language',
      user_detail_title: 'User',
      site_detail_title: 'Site',
      server_detail_title: 'Server',
      product_detail_title: 'Product',
      blog_detail_title: 'Blog',

      //
      language_tab_all_label: 'All',
      general_server_tab: 'General',
      status_server_tab: 'Status',
      setup_server_tab: 'Config Container',

      language_item_content: 'Content',
      language_item_code: 'Code',
      language_item_language: 'Language',
      //
      server_item_name: 'Server',
      server_item_host: 'Host',
      server_item_port: 'Port',
      server_item_user: 'User',
      server_item_password: 'Password',

      server_inactive_status: 'Inactive',
      server_active_status: 'Active',
      server_used: 'Used',
      server_available: 'Availble',
      server_ram: 'Ram',
      server_room: 'Room',
      server_network: 'Network',
      server_disk: 'Disk',
      //
      //
      create_form_label: 'Quick Add',
      update_form_label: 'Quick Update',
      delete_form_label: 'Quick Delete',
      delete_form_title: 'Are you sure want to delete?',
      //
      signin_title: 'Sign in',
      signin_item_email: 'Email address',
      signin_item_password: 'Password',
      //
      search_item: 'Search',
      filter_list_title: 'Filter list',
      //
      signup_title: 'Get started absolutely free.',
      signup_description: 'Free forever. No credit card needed.',
      signup_item_user_name: 'User name',
      signup_item_email: 'Email address',
      signup_item_password: 'Password',
      //
      notification_title: 'Notifications',
      notification_view_all: 'View All',
      notification_new: 'New',
      notification_read_all: 'Mark all as read',
      notification_before_that: 'Before That',
      notification_count: 'You have {count} unread messages',
      //
      pagination_per_page: 'Rows per page',
      //
      get_started: 'Get started',
      no_account: 'Don’t have an account?',
      or: 'OR',
      of: 'OF',
      and: 'AND',
      remember_me: 'Remember me',
      agree_to: 'By registering, I agree to Minimal',
      terms_of_service: 'Terms of Service',
      privacy_policy: 'Privacy Policy',
      allready_account: 'Already have an account?',
      forgot_password: 'Forgot password?',
      setting_title: 'Settings',

      //
      dark_mode_title: 'Dark Mode',
      light_mode_title: 'Light Mode',
      system_mode_title: 'System Mode',
      //
      notify_changed_language: 'Language has been changed!', // Thông báo khi một cuộc gọi API thành công chung chung.
      notify_success_api_call: 'API call was successful!', // Thông báo khi một cuộc gọi API thành công chung chung.
      notify_success_get_data: 'Data retrieved successfully!', // Thông báo khi dữ liệu được lấy thành công từ API.
      notify_success_post_data: 'Request completed successfully!', // Thông báo khi gửi dữ liệu thành công tới API (ví dụ: POST request).
      notify_success_update: 'Successfully updated the data!', // Thông báo khi cập nhật dữ liệu thành công (ví dụ: PUT request).
      notify_success_delete: 'Data deleted successfully!', // Thông báo khi xóa dữ liệu thành công (ví dụ: DELETE request).
      notify_error_generic: 'An error occurred while fetching data.', // Thông báo lỗi chung khi có sự cố trong quá trình lấy dữ liệu từ API.
      notify_error_network: 'Network error. Please check your connection.', // Thông báo khi gặp lỗi mạng (ví dụ: không kết nối được tới server).
      notify_error_server:
        'Unable to reach the server. Please try again later.', // Thông báo khi không thể kết nối tới server (ví dụ: server không phản hồi).
      notify_error_no_results: 'No results found for your request.', // Thông báo khi không tìm thấy kết quả theo yêu cầu của người dùng (ví dụ: tìm kiếm không có dữ liệu).
      notify_error_invalid_data: 'Invalid data received from the server.', // Thông báo khi dữ liệu từ server không hợp lệ (ví dụ: dữ liệu bị thiếu hoặc sai định dạng).
      notify_error_missing_data:
        'The response is missing necessary information.', // Thông báo khi phản hồi từ API thiếu thông tin cần thiết.
      notify_error_empty_response: 'Empty response. Please try again.', // Thông báo khi API trả về một phản hồi rỗng (ví dụ: không có dữ liệu trả về).
    },
  },
  {
    code: 'vn',
    name: 'Vietnamese',
    description: 'Vietnamese language',
    content: {
      // Navigation
      dashboard_nav: 'Bảng điều khiển',
      user_nav: 'Người dùng',
      server_nav: 'Máy chủ',
      site_nav: 'Trang web',
      product_nav: 'Sản phẩm',
      blog_nav: 'Blog',
      language_nav: 'Ngôn ngữ',

      // Buttons
      login_button: 'Đăng nhập',
      signup_button: 'Đăng ký',
      register_button: 'Đăng ký',
      connect_server_button: 'Kết nối',
      logout_button: 'Đăng xuất',
      submit_button: 'Gửi',
      cancel_button: 'Hủy',
      save_button: 'Lưu',
      delete_button: 'Xóa',
      update_button: 'Cập nhật',
      create_button: 'Tạo mới',
      detail_button: 'Chi tiết',
      save_changes_button: 'Lưu thay đổi',
      need_help_button: 'Cần trợ giúp',

      new_user_button: 'Người dùng mới',
      new_site_button: 'Trang mới',
      new_server_button: 'Máy chủ mới',
      new_product_button: 'Sản phẩm mới',
      new_blog_button: 'Blog mới',
      //
      dashboard_page: 'Trang Chủ',
      server_list_page: 'Máy Chủ',
      user_list_page: 'Người Dùng',
      site_list_page: 'Website',
      language_list_page: 'Ngôn Ngữ',
      product_list_page: 'Sản Phẩm',
      blog_list_page: 'Blog',

      server_detail_page: 'Server Detail',
      user_detail_page: 'User Detail',
      site_detail_page: 'Site Detail',
      product_detail_page: 'Product Detail',
      blog_detail_page: 'Blog Detail',
      // Menu
      home_menu: 'Trang chủ',
      profile_menu: 'Hồ sơ',
      settings_menu: 'Cài đặt',

      // Table titles
      language_table_title: 'Ngôn ngữ',
      user_table_title: 'Người dùng',
      site_table_title: 'Trang web',
      server_table_title: 'Máy chủ',
      product_table_title: 'Sản phẩm',
      blog_table_title: 'Blog',

      // Detail titles
      language_detail_title: 'Ngôn ngữ',
      user_detail_title: 'Người dùng',
      site_detail_title: 'Trang web',
      server_detail_title: 'Máy chủ',
      product_detail_title: 'Sản phẩm',
      blog_detail_title: 'Blog',

      // Tabs
      language_tab_all_label: 'Tất cả',
      general_server_tab: 'General',
      status_server_tab: 'Status',
      setup_server_tab: 'Config Container',

      // Items
      language_item_content: 'Nội dung',
      language_item_code: 'Mã',
      language_item_language: 'Ngôn ngữ',

      //
      server_item_name: 'Máy Chủ',
      server_item_host: 'Host',
      server_item_port: 'Port',
      server_item_user: 'Người dùng',
      server_item_password: 'Mật Khẩu',

      server_inactive_status: 'Đóng',
      server_active_status: 'Mở',

      server_used: 'Used',
      server_available: 'Availble',
      server_ram: 'Ram',
      server_room: 'Room',
      server_network: 'Network',
      server_disk: 'Disk',

      // Forms
      create_form_label: 'Thêm nhanh',
      update_form_label: 'Cập nhật nhanh',
      delete_form_label: 'Xóa nhanh',
      delete_form_title: 'Bạn có chắc chắn muốn xóa không?',

      // Sign-in
      signin_title: 'Đăng nhập',
      signin_item_email: 'Địa chỉ email',
      signin_item_password: 'Mật khẩu',

      // Search and filter
      search_item: 'Tìm kiếm',
      filter_list_title: 'Lọc danh sách',

      // Sign-up
      signup_title: 'Đăng kí hoàn toàn miễn phí.',
      signup_description: 'Miễn phí mãi mãi. Không cần thẻ tín dụng.',

      signup_item_user_name: 'Tên người dùng',
      signup_item_email: 'Địa chỉ email',
      signup_item_password: 'Mật khẩu',

      // Notifications
      notification_title: 'Thông báo',
      notification_view_all: 'Xem tất cả',
      notification_new: 'Mới',
      notification_read_all: 'Đánh dấu đã đọc tất cả',
      notification_before_that: 'Trước đó',
      notification_count: 'Bạn có {count} tin nhắn chưa đọc',

      // Pagination
      pagination_per_page: 'Số hàng mỗi trang',

      // Common texts
      get_started: 'Bắt đầu',
      no_account: 'Chưa có tài khoản?',
      or: 'HOẶC',
      of: 'CỦA',
      and: 'VÀ',
      remember_me: 'Ghi nhớ đăng nhập',
      agree_to: 'Khi đăng ký, tôi đồng ý với Minimal',
      terms_of_service: 'Điều khoản dịch vụ',
      privacy_policy: 'Chính sách bảo mật',
      allready_account: 'Đã có tài khoản?',
      forgot_password: 'Quên mật khẩu?',
      setting_title: 'Cài đặt',

      //
      dark_mode_title: 'Dark Mode',
      light_mode_title: 'Light Mode',
      system_mode_title: 'System Mode',
      //
      // API notifications
      notify_changed_language: 'Ngôn ngữ đã được thay đổi!',
      notify_success_api_call: 'Gọi API thành công!',
      notify_success_get_data: 'Lấy dữ liệu thành công!',
      notify_success_post_data: 'Yêu cầu hoàn tất thành công!',
      notify_success_update: 'Cập nhật dữ liệu thành công!',
      notify_success_delete: 'Xóa dữ liệu thành công!',
      notify_error_generic: 'Đã xảy ra lỗi khi lấy dữ liệu.',
      notify_error_network: 'Lỗi mạng. Vui lòng kiểm tra kết nối của bạn.',
      notify_error_server:
        'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      notify_error_no_results:
        'Không tìm thấy kết quả nào theo yêu cầu của bạn.',
      notify_error_invalid_data: 'Dữ liệu không hợp lệ từ máy chủ.',
      notify_error_missing_data: 'Phản hồi thiếu thông tin cần thiết.',
      notify_error_empty_response: 'Phản hồi trống. Vui lòng thử lại.',
    },
  },
];
