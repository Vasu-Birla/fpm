import * as path from 'path';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// Allowed redirects for '/' and '/superadmin'
const allowedRedirects = [
    // Base
    '/',
    '/user_pandp',
    '/user_tandc',
    '/reports',    
    '/reports/:filename',
    '/uploads/:filename',
    '/terms_conditions',
    '/privacy_policy',

    // Superadmin Auth
    '/superadmin',
    '/superadmin/login',
    '/superadmin/kiltel',
    '/superadmin/check_session',
    '/superadmin/logout',
    '/superadmin/profile',
    '/superadmin/changepass',
    '/superadmin/on_off_multifactor',
    '/superadmin/two_step_verification',
    '/superadmin/update_admin_pic',

    // Forgot/reset
    '/superadmin/send-otp',
    '/superadmin/verify-otp',
    '/superadmin/reset-password',

    // Client Section
    '/superadmin/add_client',
    '/superadmin/checktrn',
    '/superadmin/checkemail',
    '/superadmin/checkphonenumber',
    '/superadmin/view_clients',
    '/superadmin/edit_client',
    '/superadmin/update_client_status',
    '/superadmin/delete_clients',

    // Reports Section
    '/superadmin/reports',
    '/superadmin/reports/:filename',
    '/superadmin/assign_to_role',
    '/superadmin/upload_candidate_drug_report',
    '/superadmin/upload_candidate_credit_report',
    '/superadmin/upload_candidate_social_report',
    '/superadmin/update_candidate_report_status',
    '/superadmin/add_candidate_note',
    '/superadmin/get_candidate_notes', // :id will be handled below
    '/superadmin/get_candidate_notes/:id',
    // Note: If you want to allow get_candidate_notes/:id, see note below.

    // Confidential Report
    '/superadmin/confidential_report',
    '/superadmin/update_confidential_report',
    '/superadmin/update_candidate_field',
    '/superadmin/upload_admin_degree_certificate',
    '/superadmin/validate_confidential_report',
    '/superadmin/generate_pdf_report',
    '/superadmin/render_report_html', // :id/:person_id - see below
    '/superadmin/render_report_html/:id/:person_id',

    '/superadmin/drug_report',
    '/superadmin/credit_report',

    // Candidate Section
    '/superadmin/add_candidate',
    '/superadmin/checkCandidateTrnUnique',
    '/superadmin/checkCandidateEmailUnique',
    '/superadmin/checkCandidatePhoneUnique',
    '/superadmin/view_candidates',
    '/superadmin/edit_candidate',
    '/superadmin/update_candidate_status',
    '/superadmin/excel_csv_parser',

    // Role Mgmt
    '/superadmin/role_mgmt',
    '/superadmin/checkrole',
    '/superadmin/edit_role',
    '/superadmin/update_role_status',

    // Screening
    '/superadmin/screening',

    // Subadmin
    '/superadmin/add_subadmin',
    '/superadmin/view_subadmins',
    '/superadmin/edit_subadmin',
    '/superadmin/update_subadmin_status',

    // Faqs
    '/superadmin/addFaq',
    '/superadmin/viewFaq',
    '/superadmin/editFaq',
    '/superadmin/deleteFaq',

    // T&C & Policy
    '/superadmin/user_tandc',
    '/superadmin/user_pandp',

    // Global/Slider
    '/superadmin/globalSettings',
    '/superadmin/slider',
    '/superadmin/sendotp_global',
    '/superadmin/deleteSetting',

    // Registration/Notification
    '/superadmin/send_registration_link',
    '/superadmin/candidate_registration', // :token
    '/superadmin/candidate_registration/:token',    
    '/superadmin/check_link_email',
    '/superadmin/request_registration_link',
    '/superadmin/bell_notifications',
    '/superadmin/notifications',
    '/superadmin/candidate_reg_post',
    '/superadmin/mark_notification_read',



    //for public url 

    '/sscl/candidate_registration', // :token
    '/sscl/candidate_registration/:token',
    '/sscl/candidate_reg_post',

    // Logs
    '/superadmin/get_logs',
    '/superadmin/get_sent_tokens',

    // Error pages
    '/superadmin/error404',
    '/superadmin/error500',



    //------------------ cleint ---------------------------



    // Client Auth
    '/client',
    '/client/login',
    '/client/logout',
    '/client/check_session',
    '/client/profile',
    '/client/changepass',
    '/client/on_off_multifactor',
    '/client/two_step_verification',
    '/client/update_admin_pic',

    // Forgot/reset
    '/client/send-otp',
    '/client/verify-otp',
    '/client/reset-password',

    // Client Section
    '/client/add_client',
    '/client/checkemail',
    '/client/checkphonenumber',
    '/client/view_clients',
    '/client/edit_client',
    '/client/update_client_status',
    '/client/delete_clients',

    // Reports Section
    '/client/reports',
    '/client/reports/:filename',
    '/client/assign_to_role',
    '/client/upload_candidate_drug_report',
    '/client/upload_candidate_credit_report',
    '/client/upload_candidate_social_report',
    '/client/update_candidate_report_status',
    '/client/add_candidate_note',
    '/client/get_candidate_notes', // :id will be handled below
    '/client/get_candidate_notes/:id',
    // Note: If you want to allow get_candidate_notes/:id, see note below.

    // Confidential Report
    '/client/confidential_report',
    '/client/update_confidential_report',
    '/client/validate_confidential_report',
    '/client/generate_pdf_report',
    '/client/render_report_html', // :id/:person_id - see below
    '/client/render_report_html/:id',

    '/client/drug_report',
    '/client/credit_report',

    // Candidate Section
    '/client/add_candidate',
    '/client/checkCandidateTrnUnique',
    '/client/checkCandidateEmailUnique',
    '/client/checkCandidatePhoneUnique',
    '/client/view_candidates',
    '/client/edit_candidate',
    '/client/update_candidate_status',
    '/client/excel_csv_parser',

    // Role Mgmt
    '/client/role_mgmt',
    '/client/checkrole',
    '/client/edit_role',
    '/client/update_role_status',

    // Screening
    '/client/screening',

    // Subadmin
    '/client/add_subadmin',
    '/client/view_subadmins',
    '/client/edit_subadmin',
    '/client/update_subadmin_status',

    // Faqs
    '/client/addFaq',
    '/client/viewFaq',
    '/client/editFaq',
    '/client/deleteFaq',

    // T&C & Policy
    '/client/user_tandc',
    '/client/user_pandp',

    // Global/Slider
    '/client/globalSettings',
    '/client/slider',
    '/client/sendotp_global',
    '/client/deleteSetting',

    // Registration/Notification
    '/client/send_registration_link',
    '/client/candidate_registration', // :token
    '/client/candidate_registration/:token',
    '/client/check_link_email',
    '/client/request_registration_link',
    '/client/bell_notifications',
    '/client/notifications',
    '/client/candidate_reg_post',
    '/client/mark_notification_read',

    // Logs
    '/client/get_logs',
    '/client/get_sent_tokens',

    // Error pages
    '/client/error404',
    '/client/error500',



    //========== APis section
    '/api', 
    '/api/v1/',
    '/api/v1/health',
    
    //=========== Secure S3 bucket URLs 

    '/secure',
    '/secure/',
    '/secure/syncdb',
    '/secure/file/:model/:id/:field',
'/secure/file/:model/:id/:field/', // optional trailing slash


    //=============== Secure Logs ==========

        '/superadmin/download-audit-logs'

];



const validateRedirectUrl = (req, res, next) => {
    const redirectUrl = req.query.redirect || req.body.redirect || '';


     // Skip static file requests (e.g., .png, .jpg, .css, .js)
     const staticFileRegex = /\.(pdf|gif|css|js|png|jpg|jpeg|css|js|ico|svg|woff|woff2|ttf|otf|eot|map|html|txt|pdf)$/i;

    //  // Allow static files to bypass validation
    //  if (
    //     req.path.startsWith('/adminassets/') || 
    //     req.path.startsWith('/assets/') || 
    //     req.path.startsWith('/logs/') || 
    //     req.path.startsWith('/page/') ||
    //     req.path.startsWith('/uploads/') ||
    //     req.path.startsWith('/images/') ||
    //     req.path.startsWith('images/') ||
    //     req.path.startsWith('/reports/') ||
    //     staticFileRegex.test(req.path)
    // ) {
    //     console.log("allowed static path -> ",req.path)
    //     return next();
    // }
    
    // // Check if the redirectUrl or current path is allowed
    // if (!allowedRedirects.includes(redirectUrl) && !allowedRedirects.includes(req.path)) {
    //     return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    // }

        const matchesAllowed = allowedRedirects.some(allowed => {
        if (req.path === allowed) return true;
        if (allowed.includes(':')) {
            const regex = new RegExp('^' + allowed.replace(/:[^/]+/g, '[^/]+') + '$');
            return regex.test(req.path);
        }
        return false;
    });


        if (!matchesAllowed && !allowedRedirects.includes(redirectUrl)) {
        return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }


    next();
};

export { validateRedirectUrl };
