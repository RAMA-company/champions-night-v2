// user/app.js

// وارد کردن کتابخانه Supabase و فایل پیکربندی
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.44.2/dist/module/supabase-js.mjs';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../assets/config.js';

// ایجاد کلاینت Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('فایل app.js با موفقیت بارگذاری شد!');

// اجرای توابع بر اساس صفحه فعلی
document.addEventListener('DOMContentLoaded', () => {
    // از طریق URL تشخیص می‌دهیم که در کدام صفحه هستیم
    const path = window.location.pathname;
    
    if (path.includes('users.html')) {
        // اگر در صفحه کاربران هستیم، لیست کاربران را بارگذاری می‌کنیم
        loadUsers();
    } else if (path.includes('user.html')) {
        // اگر در صفحه جزئیات کاربر هستیم، جزئیات را بارگذاری می‌کنیم
        loadUserDetails();
    } else if (path.includes('admins.html')) {
        // اگر در صفحه ادمین‌ها هستیم، لیست ادمین‌ها را بارگذاری می‌کنیم
        loadAdmins();
    } else if (path.includes('reports.html')) {
        // اگر در صفحه گزارشات هستیم، رویدادهای مربوطه را تنظیم می‌کنیم
        setupReportsPage();
    } else if (path.includes('admins-index.html')) {
        // اگر در صفحه داشبورد هستیم، آمار را بارگذاری می‌کنیم
        loadDashboardStats();
    }
});

// -------------------------------------
// توابع مربوط به هر صفحه
// -------------------------------------

/**
 * بارگذاری لیست کاربران در صفحه users.html
 * جدول: users
 */
async function loadUsers() {
    console.log('بارگذاری کاربران...');
    const usersTableBody = document.getElementById('users-table-body');
    if (!usersTableBody) return;

    try {
        const { data: members, error } = await supabase
            .from('users') // استفاده از جدول users
            .select('id, full_name, membership_code, status'); // استفاده از membership_code

        if (error) {
            console.error('خطا در واکشی کاربران:', error.message);
            return;
        }

        usersTableBody.innerHTML = '';
        members.forEach(member => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="py-3 px-6">${member.full_name}</td>
                <td class="py-3 px-6">${member.membership_code}</td>
                <td class="py-3 px-6">${member.status === 'Active' ? 'فعال' : 'غیرفعال'}</td>
                <td class="py-3 px-6">
                    <a href="user.html?id=${member.id}" class="text-blue-500 hover:text-blue-700 font-medium">مشاهده</a>
                </td>
            `;
            usersTableBody.appendChild(row);
        });

    } catch (err) {
        console.error('خطای غیرمنتظره:', err.message);
    }
}

/**
 * بارگذاری جزئیات کاربر در صفحه user.html
 * جداول: users و subscriptions
 */
async function loadUserDetails() {
    console.log('بارگذاری جزئیات کاربر...');
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        console.error('شناسه کاربر در URL یافت نشد.');
        return;
    }

    try {
        // واکشی جزئیات کاربر از جدول users
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('خطا در واکشی جزئیات کاربر:', userError.message);
            return;
        }

        document.getElementById('user-detail-name').textContent = user.full_name;
        const userInfoDisplay = document.getElementById('user-info-display');
        userInfoDisplay.innerHTML = `
            <p><strong>نام:</strong> ${user.full_name}</p>
            <p><strong>شماره تماس:</strong> ${user.phone}</p>
            <p><strong>کد عضویت:</strong> ${user.membership_code}</p>
            <p><strong>وضعیت:</strong> ${user.status}</p>
        `;

        // واکشی اشتراک‌های کاربر از جدول subscriptions
        const { data: subscriptions, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId) // استفاده از user_id
            .order('end_date', { ascending: false });

        if (subError) {
            console.error('خطا در واکشی اشتراک‌ها:', subError.message);
            return;
        }

        const subsTableBody = document.getElementById('subscriptions-table-body');
        subsTableBody.innerHTML = '';
        subscriptions.forEach(sub => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-2 px-4">${sub.start_date}</td>
                <td class="py-2 px-4">${sub.end_date}</td>
                <td class="py-2 px-4">${sub.status}</td>
            `;
            subsTableBody.appendChild(row);
        });

        // اضافه کردن event listenerها به دکمه‌ها
        document.getElementById('edit-user-btn').addEventListener('click', () => {
            alert('ویرایش کاربر (باید پیاده‌سازی شود)');
        });

        document.getElementById('delete-user-btn').addEventListener('click', async () => {
            if (window.confirm('آیا از حذف این کاربر مطمئن هستید؟')) {
                const { error } = await supabase.from('users').delete().eq('id', userId);
                if (error) {
                    console.error('خطا در حذف کاربر:', error.message);
                } else {
                    alert('کاربر با موفقیت حذف شد.');
                    window.location.href = 'users.html';
                }
            }
        });

        document.getElementById('deactivate-user-btn').addEventListener('click', async () => {
            const { error } = await supabase.from('users').update({ status: 'Inactive' }).eq('id', userId);
            if (error) {
                console.error('خطا در غیرفعال کردن کاربر:', error.message);
            } else {
                alert('کاربر با موفقیت غیرفعال شد.');
                loadUserDetails(); // به‌روزرسانی صفحه
            }
        });

        document.getElementById('extend-sub-btn').addEventListener('click', async () => {
            const daysToExtend = document.getElementById('extend-days-input').value;
            if (!daysToExtend || daysToExtend <= 0) {
                alert('تعداد روز معتبر نیست.');
                return;
            }

            // پیدا کردن آخرین اشتراک برای تمدید
            const latestSub = subscriptions.length > 0 ? subscriptions[0] : null;

            if (latestSub) {
                const currentEndDate = new Date(latestSub.end_date);
                currentEndDate.setDate(currentEndDate.getDate() + parseInt(daysToExtend));
                
                const { error } = await supabase.from('subscriptions').update({ end_date: currentEndDate.toISOString().split('T')[0] }).eq('id', latestSub.id);

                if (error) {
                    console.error('خطا در تمدید اشتراک:', error.message);
                } else {
                    alert('اشتراک با موفقیت تمدید شد.');
                    loadUserDetails(); // به‌روزرسانی صفحه
                }
            } else {
                alert('اشتراکی برای تمدید وجود ندارد.');
            }
        });

    } catch (err) {
        console.error('خطای غیرمنتظره:', err.message);
    }
}

/**
 * بارگذاری لیست ادمین‌ها در صفحه admins.html
 * جدول: admins
 */
async function loadAdmins() {
    console.log('بارگذاری ادمین‌ها...');
    const adminsTableBody = document.getElementById('admins-table-body');
    if (!adminsTableBody) return;

    try {
        const { data: admins, error } = await supabase
            .from('admins') // استفاده از جدول admins
            .select('email, role, created_at');

        if (error) {
            console.error('خطا در واکشی ادمین‌ها:', error.message);
            return;
        }

        adminsTableBody.innerHTML = '';
        admins.forEach(admin => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="py-3 px-6">${admin.email}</td>
                <td class="py-3 px-6">${admin.role}</td>
                <td class="py-3 px-6">${new Date(admin.created_at).toLocaleDateString('fa-IR')}</td>
            `;
            adminsTableBody.appendChild(row);
        });

        document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email-input').value;

            const { error: insertError } = await supabase.from('admins').insert([{ email, role: 'admin' }]);

            if (insertError) {
                console.error('خطا در افزودن ادمین جدید:', insertError.message);
                alert('خطا در افزودن ادمین جدید.');
            } else {
                alert('ادمین با موفقیت افزوده شد.');
                document.getElementById('admin-email-input').value = ''; // پاک کردن ورودی
                loadAdmins(); // به‌روزرسانی لیست
            }
        });

    } catch (err) {
        console.error('خطای غیرمنتظره:', err.message);
    }
}

/**
 * تنظیمات صفحه گزارشات در reports.html
 * جداول: users, subscriptions, sessions, admins
 */
function setupReportsPage() {
    console.log('آماده‌سازی صفحه گزارشات...');
    const generateBtn = document.getElementById('generate-report-btn');
    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        const sheet = document.getElementById('report-sheet-select').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const downloadLinkContainer = document.getElementById('download-link-container');
        const downloadLink = document.getElementById('download-link');

        try {
            let query = supabase.from(sheet).select('*');
            
            // بسته به جدول، فیلد تاریخ را انتخاب می‌کنیم
            let dateColumn = 'created_at';
            if (sheet === 'sessions') {
                dateColumn = 'session_date';
            } else if (sheet === 'subscriptions') {
                dateColumn = 'start_date';
            }

            if (startDate) {
                query = query.gte(dateColumn, startDate);
            }
            if (endDate) {
                query = query.lte(dateColumn, endDate);
            }

            const { data, error } = await query;
            if (error) {
                console.error('خطا در تهیه گزارش:', error.message);
                alert('خطا در تهیه گزارش.');
                return;
            }

            // تبدیل داده‌ها به فرمت CSV ساده
            const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
                + Object.keys(data[0]).join(',') + '\n'
                + data.map(row => Object.values(row).join(',')).join('\n');
            
            const encodedUri = encodeURI(csvContent);
            downloadLink.setAttribute('href', encodedUri);
            downloadLink.setAttribute('download', `${sheet}-report.csv`);
            downloadLinkContainer.classList.remove('hidden');
            alert('گزارش با موفقیت تهیه شد. اکنون می‌توانید آن را دانلود کنید.');

        } catch (err) {
            console.error('خطای غیرمنتظره:', err.message);
            alert('خطا در تهیه گزارش.');
        }
    });
}

/**
 * بارگذاری آمار داشبورد در صفحه admins-index.html
 * جداول: users و subscriptions
 */
async function loadDashboardStats() {
    console.log('بارگذاری آمار داشبورد...');
    try {
        // واکشی تعداد اعضای فعال و غیرفعال از جدول users
        const { count: activeCount, error: activeError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Active');
        
        const { count: inactiveCount, error: inactiveError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Inactive');

        if (!activeError && !inactiveError) {
            document.getElementById('active-members').textContent = activeCount;
            document.getElementById('inactive-members').textContent = inactiveCount;
        }

        // واکشی اشتراک‌های رو به اتمام از جدول subscriptions
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 30);
        
        const { data: expiringSubs, error: expiringError } = await supabase
            .from('subscriptions')
            .select('end_date')
            .gte('end_date', today.toISOString().split('T')[0])
            .lte('end_date', futureDate.toISOString().split('T')[0]);

        if (!expiringError) {
            const expiring7Days = expiringSubs.filter(s => {
                const endDate = new Date(s.end_date);
                const diffTime = endDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            }).length;
            
            const expiring12Days = expiringSubs.filter(s => {
                const endDate = new Date(s.end_date);
                const diffTime = endDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 12;
            }).length;

            const expiring30Days = expiringSubs.filter(s => {
                const endDate = new Date(s.end_date);
                const diffTime = endDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 30;
            }).length;

            document.getElementById('expiring-7-days').textContent = expiring7Days;
            document.getElementById('expiring-12-days').textContent = expiring12Days;
            document.getElementById('expiring-30-days').textContent = expiring30Days;
        }

        // نرخ استمرار (نیاز به یک تابع پیچیده‌تر دارد)
        document.getElementById('avg-consistency').textContent = '--%';
    } catch (err) {
        console.error('خطای غیرمنتظره در داشبورد:', err.message);
    }
}
