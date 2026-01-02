<!-- Header Start -->
    <?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
    <?php include('sidebar.php'); ?>
<!-- Sidebar End -->
        
<!-- ========================
    Start Page Content
========================= -->
    
<div class="page-wrapper">

    <!-- Start Content -->
    <div class="content">

        <!-- Start Page Header -->
        <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div class="flex-grow-1">
                <h4 class="fw-bold mb-0">Firm Users List</h4>
            </div>
            <div class="text-end d-flex">
                <a href="firmstaff-create.php" class="btn btn-primary ms-2 fs-13 btn-md"><i class="ti ti-plus me-1"></i>Add User</a>
            </div>
        </div>
        <!-- End Page Header -->

        <!--  Start Filter -->
        <div class=" d-flex align-items-center justify-content-between flex-wrap">
            <div>
                <div class="search-set mb-3">
                    <div class="d-flex align-items-center flex-wrap gap-2">
                        <div class="table-search d-flex align-items-center mb-0">
                            <div class="search-input">
                                <a href="javascript:void(0);" class="btn-searchset"></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="d-flex table-dropdown mb-3 right-content align-items-center flex-wrap row-gap-3">
            </div>
        </div>
        <!--  End Filter -->

        <!--  Start Table -->
        <div class="table-responsive">
            <table id="firmstaffTable" class="table table-striped table-bordered table-nowrap">
                <thead>
                    <tr>
                        <th>Sr. No.</th>
                        <th>Role</th>
                        <th>User</th>
                        <th>Email</th>
                        <th>Phone Number</th>
                        <th>License Number</th>
                        <th>Created</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody >
                    <tr>
                        <td>1</td>
                        <th>Paralegal</th>
                        <td>Aarti Sharma</td>
                        <td>aarti.sharma@lexlaw.com</td>
                        <td>+91 9876543210</td>
                        <td>LAW/458923/2025</td>
                        <td>2025-08-01</td>
                        <td><span class="badge badge-soft-success border border-success">Active</span></td>
                        <td>
                            <div class="d-flex align-items-center gap-1">
                                <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1" data-bs-toggle="dropdown">
                                    <i class="ti ti-dots-vertical"></i>
                                </a>
                                <ul class="dropdown-menu p-2">
                                    <li><a href="firmstaff-edit.php" class="dropdown-item"><i class="ti ti-edit me-2"></i> Edit</a></li>
                                    <li>
                                        <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center text-danger">
                                            <i class="ti ti-power me-2 text-danger"></i> Deactivate
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="dropdown-item text-danger delete-lawyer-btn" data-id="123">
                                            <i class="ti ti-trash me-2"></i> Delete
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>Finance</td>
                        <td>Ramesh Patel</td>
                        <td>ramesh.patel@justicehub.com</td>
                        <td>+91 9123456780</td>
                        <td>LAW/789012/2025</td>
                        <td>2025-08-01</td>
                        <td><span class="badge badge-soft-danger border border-danger">Suspended</span></td>
                        <td>
                            <div class="d-flex align-items-center gap-1">
                                <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1" data-bs-toggle="dropdown">
                                    <i class="ti ti-dots-vertical"></i>
                                </a>
                                <ul class="dropdown-menu p-2">
                                    <li><a href="firmstaff-edit.php" class="dropdown-item"><i class="ti ti-edit me-2"></i> Edit</a></li>
                                    <li>
                                        <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center text-success">
                                            <i class="ti ti-power me-2 text-success"></i> Activate
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="dropdown-item text-danger delete-lawyer-btn" data-id="123">
                                            <i class="ti ti-trash me-2"></i> Delete
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <!--  End Table -->
        
    </div>
    <!-- End Content -->

</div>

<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
    <?php include ('footer.php'); ?>
<!-- Footer End -->

<script>
// Delete Record
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.delete-lawyer-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();

            const lawfirmId = this.getAttribute('data-id');

            Swal.fire({
                title: 'Are you sure?',
                text: "This lawyer will be permanently deleted.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                reverseButtons: true,
                customClass: {
                    confirmButton: 'swal2-confirm btn btn-danger ms-2',
                    cancelButton: 'swal2-cancel btn btn-secondary'
                },
                buttonsStyling: false
            }).then((result) => {
                if (result.isConfirmed) {
                    // Redirect to delete-lawfirm.php with the ID
                    window.location.href = '#delete-lawyer.php?id=' + lawfirmId;
                }
            });
        });
    });
});
</script>






