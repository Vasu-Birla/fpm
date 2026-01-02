<!-- Header Start -->
    <?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
    <?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<div class="page-wrapper">
    <div class="content">

        <!-- Start Page Header -->
        <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div class="flex-grow-1">
                <h5 class="fw-bold mb-0">
                    <a href="courtfiling-list.php" class="text-dark"> <i class="ti ti-chevron-left me-1"></i>Court Filing Tracker List </a>
                    <span class="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">Total : 10</span>
                </h5>
            </div>
            <div class="text-end d-flex">
                <a href="courtfiling-create.php" class="btn btn-primary ms-2 fs-13 btn-md"><i class="ti ti-plus me-1"></i> Add Court Filing Tracker </a>
            </div>
        </div>
        <!-- End Page Header -->

        <!-- Table -->
        <div class="table-responsive">
            <table id="courtfilingTable" class="table table-bordered align-middle">
                <thead class="table-light">
                    <tr>
                        <th>#</th>
                        <th>Matter ID</th>
                        <th>Court Type</th>
                        <th>Filing Type</th>
                        <th>Filing Date</th>
                        <th>Reference No.</th>
                        <th>Status</th>
                        <th>Receipt</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>MTR-102</td>
                        <td>Supreme Court</td>
                        <td>Statement</td>
                        <td>2025-10-10</td>
                        <td>REF-98765</td>
                        <td><span class="badge bg-success-subtle text-success border border-success">Filed</span></td>
                        <td><a href="#uploads/receipt1.pdf" target="_blank"><i class="ti ti-file-text"></i> View</a></td>
                        <td>
                            <div class="dropdown">
                                <a href="#" class="shadow-sm border rounded-2 p-1 d-inline-flex" data-bs-toggle="dropdown"><i class="ti ti-dots-vertical"></i></a>
                                <ul class="dropdown-menu p-2">
                                    <li><a href="courtfiling-edit.php" class="dropdown-item"><i class="ti ti-edit me-2"></i>Edit</a></li>
                                    <li><a href="javascript:void(0);" class="dropdown-item text-danger delete-btn" data-id="1"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Footer Start -->
    <?php include('footer.php'); ?>
<!-- Footer End -->

<script>
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            Swal.fire({
                title: 'Are you sure?',
                text: 'This court filing record will be deleted permanently.',
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
            }).then(result => {
                if (result.isConfirmed) {
                    window.location.href = '#delete-filing.php?id=' + id;
                }
            });
        });
    });
});
</script>
