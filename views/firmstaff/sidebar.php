
<style>
/* Active link look */
#sidebar-menu a.active {
  background: #001489;          /* Bootstrap primary */
  color: #fff !important;   
  border-radius: 6px;
  font-weight: 600;
}

/* Parent submenu label highlight */
#sidebar-menu .submenu > a.active {
  color: #0d6efd;
}

/* Ensure opened submenu is visible */
#sidebar-menu .submenu.menu-open > ul {
  display: block;
}

.sidebar .sidebar-menu > ul li.menu-title {
    font-weight: 600;
    color: #00d3c7;
    font-size: 14px;
}
</style>

<!-- Sidenav Menu Start -->
<div class="sidebar" id="sidebar">
    
    <!-- Start Logo -->   
    <div class="sidebar-logo">   
        <div>    
            <!-- Logo Normal -->
            <a href="index.php" class="logo logo-normal">
                <img src="../superadminassets/img/logo.png" alt="Logo" style="width: 49px;">
            </a>

            <!-- Logo Small -->
            <a href="index.php" class="logo-small">
                <img src="../superadminassets/img/logo.png" alt="Logo" >
            </a>

            <!-- Logo Dark -->
            <a href="index.php" class="dark-logo">
                <img src="../superadminassets/img/logo.png" alt="Logo" style="width: 49px;">
            </a>
        </div>
        <button class="sidenav-toggle-btn btn border-0 p-0 active" id="toggle_btn"> 
            <i class="ti ti-arrow-left"></i>
        </button>

        <!-- Sidebar Menu Close -->
        <button class="sidebar-close">
            <i class="ti ti-x align-middle"></i>
        </button>                
    </div>
    <!-- End Logo -->

    <!-- Sidenav Menu -->
    <div class="sidebar-inner" data-simplebar>                
        <div id="sidebar-menu" class="sidebar-menu">
            <ul>
                <!-- <li class="menu-title"><span>Main Menu</span></li> -->
                <li>
                    <ul>
                        <li>
                            <a href="index.php">
                                <i class="ti ti-layout-dashboard"></i><span>Dashboard</span>
                            </a>
                        </li>
                    </ul>
                </li>

                <li class="menu-title"><span>Firm Management</span></li>
                <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-gavel"></i><span>Firm Staff</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="firmstaff-list.php">Firm Staff List</a></li>
                                <li><a href="firmstaff-create.php">Add Firm Staff</a></li>
                            </ul>
                        </li>             
                    </ul>
                </li>
                <li>
                    <ul>
                        <li>
                            <a href="billing.php">
                                <i class="ti ti-file-invoice"></i><span>Billing & Invoicing</span>
                            </a>
                        </li>
                    </ul>
                </li>

                <li class="menu-title"><span>Lawyer Management</span></li>
                <!-- <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-scale"></i><span>Cases</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="cases-list.php"> Cases List</a></li>
                                <li><a href="cases-create.php"> Add Case</a></li>
                            </ul>
                        </li>
                    </ul>
                </li> -->
                <li>
                    <ul>
                        <li>
                            <a href="cases-list.php">
                                <i class="ti ti-scale"></i><span>Case</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-users"></i><span>Clients</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="client-list.php"> Client List</a></li>
                                <li><a href="client-create.php"> Add Client</a></li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-user-heart"></i><span>Client Consultation</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="consultation-list.php"> Consultation List</a></li>
                                <li><a href="consultation-create.php"> Add Consultation</a></li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <!-- <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-file-text"></i><span>Legal Drafting</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="legaldrafting-list.php"> Legal Drafting List</a></li>
                                <li><a href="legaldrafting-create.php"> Add Legal Drafting</a></li>
                            </ul>
                        </li>
                    </ul>
                </li> -->
                <!-- <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-notebook"></i><span>Research Log</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="researchlog-list.php"> Research Log List</a></li>
                                <li><a href="researchlog-create.php"> Add Research Log</a></li>
                            </ul>
                        </li>
                    </ul>
                </li> -->

                <li class="menu-title"><span>Paralegal Management</span></li>
                <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-file-description"></i><span>Document Drafting</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="documentdrafting-list.php"> Document Drafting List</a></li>
                                <li><a href="documentdrafting-create.php"> Add Document Drafting</a></li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <!-- <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-folder"></i><span>Court Filing Tracker</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="courtfiling-list.php"> Court Filing Tracker List</a></li>
                                <li><a href="courtfiling-create.php"> Add Court Filing Tracker</a></li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-calendar-event"></i><span>Deadline Tracker</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="deadlinetracker-list.php"> Deadline Tracker List</a></li>
                                <li><a href="deadlinetracker-create.php"> Add Deadline Tracker</a></li>
                            </ul>
                        </li>
                    </ul>
                </li> -->
                <!-- <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-folder-open"></i><span>Evidence</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="evidence-list.php"> Evidence List</a></li>
                                <li><a href="evidence-create.php"> Add Evidence</a></li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-brain"></i><span>Research Assistant</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="researchassistant-list.php"> Research Assistant List</a></li>
                                <li><a href="researchassistant-create.php"> Add Research Assistant</a></li>
                            </ul>
                        </li>
                    </ul>
                </li> -->

                <li class="menu-title"><span>Finance Panel</span></li>
                <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-file-invoice"></i><span>Invoice</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="invoice-list.php"> Invoice List</a></li>
                                <li><a href="invoice-create.php"> Add Invoice</a></li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <!-- <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-receipt-2"></i><span>Payment Receipt</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="paymentreceipt-list.php"> Payment Receipt List</a></li>
                                <li><a href="paymentreceipt-create.php"> Add Payment Receipt</a></li>
                            </ul>
                        </li>
                    </ul>
                </li> -->
                <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-wallet"></i><span>Disbursement</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="disbursement-list.php"> Disbursement List</a></li>
                                <li><a href="disbursement-create.php"> Add Disbursement</a></li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <li>
                    <ul>
                        <li>
                            <a href="clientledger-list.php">
                                <i class="ti ti-clipboard-list"></i><span>Client Ledger</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <!-- <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-report-money"></i><span>Account Reconciliation</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="reconciliation-list.php"> Account Reconciliation List</a></li>
                                <li><a href="reconciliation-create.php"> Add Account Reconciliation</a></li>
                            </ul>
                        </li>
                    </ul>
                </li> -->

                <li class="menu-title"><span>Intake / Support Panel</span></li>
                <!-- <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-file-import"></i><span>Client Intake</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="clientintake-list.php"> Client Intake List</a></li>
                                <li><a href="clientintake-create.php"> Add Client Intake</a></li>
                            </ul>
                        </li>
                    </ul>
                </li> -->
                <li>
                    <ul>
                        <li>
                            <a href="clientintake-list.php">
                                <i class="ti ti-file-import"></i><span>Client Intake List</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-calendar-check"></i><span>Appointment</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="appointment-list.php"> Appointment List</a></li>
                                <li><a href="appointment-create.php"> Add Appointment</a></li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <!-- <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-mail"></i><span>Correspondence Log</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="correspondencelog-list.php"> Correspondence Log List</a></li>
                                <li><a href="correspondencelog-create.php"> Add Correspondence Log</a></li>
                            </ul>
                        </li>
                    </ul>
                </li> -->
                <!-- <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-folder-symlink"></i><span>Document Intake</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="documentintake-list.php"> Document Intake List</a></li>
                                <li><a href="documentintake-create.php"> Add Document Intake</a></li>
                            </ul>
                        </li>
                    </ul>
                </li> -->
                <li>
                    <ul>
                        <li class="submenu">
                            <a href="javascript:void(0);">
                                <i class="ti ti-headset"></i><span>Task Support</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="tasksupport-list.php"> Task Support List</a></li>
                                <li><a href="tasksupport-create.php"> Add Task Support</a></li>
                            </ul>
                        </li>
                    </ul>
                </li>

                <li class="menu-title"><span>Setting</span></li>
                <li>
                    <ul>
                        <li>
                            <a href="documents.php">
                                <i class="ti ti-bell"></i><span>Documents & E-Sign</span>
                            </a>
                        </li>
                        <li>
                            <ul>
                                <li class="submenu">
                                    <a href="javascript:void(0);">
                                        <i class="ti ti-notes"></i><span>Task & Time</span>
                                        <span class="menu-arrow"></span>
                                    </a>
                                    <ul>
                                        <li><a href="task-list.php"> Task & Time List</a></li>
                                        <li><a href="task-create.php"> Add Task & Time</a></li>
                                    </ul>
                                </li>                
                            </ul>    
                        </li>
                        <li>
                            <a href="calendar.php">
                                <i class="ti ti-calendar-x"></i><span> Calendar</span>
                            </a>
                        </li>
                        <li>
                            <a href="notification.php">
                                <i class="ti ti-bell"></i><span> Notifications</span>
                            </a>
                        </li>
                        <li>
                            <a href="support.php">
                                <i class="ti ti-headset"></i><span> Support & Help</span>
                            </a>
                        </li>
                    </ul>
                </li>                        
            </ul>                   
        </div>
    </div>

</div>
<!-- Sidenav Menu End -->

<script>
document.addEventListener("DOMContentLoaded", function () {
    // Get current path without query/hash
    let currentPath = window.location.pathname.split("/").pop().toLowerCase();

    // If blank (like "/"), assume "index.php"
    if (currentPath === "" || currentPath === "/") {
        currentPath = "index.php";
    }

    // Select all sidebar links
    const links = document.querySelectorAll("#sidebar-menu a[href]");

    links.forEach(link => {
        let linkPath = link.getAttribute("href").split("/").pop().toLowerCase();

        if (linkPath === currentPath) {
            // Add active class to this link
            link.classList.add("active");

            // Open submenu if inside one
            const submenu = link.closest(".submenu");
            if (submenu) {
                submenu.classList.add("menu-open");
                const parentLink = submenu.querySelector(":scope > a");
                if (parentLink) parentLink.classList.add("active");
                const subUl = submenu.querySelector("ul");
                if (subUl) subUl.style.display = "block";
            }
        }
    });
});
</script>