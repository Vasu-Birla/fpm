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
                <h5 class="fw-bold mb-0">
                    <a href="legaldrafting-list.php" class="text-dark"> <i class="ti ti-chevron-left me-1"></i>Legal Drafting List </a>
                    <span class="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1"> Total Legal Drafting : 12 </span>
                </h5>
            </div>
            <div class="text-end d-flex">
                <a href="legaldrafting-create.php" class="btn btn-primary ms-2 fs-13 btn-md">
                    <i class="ti ti-plus me-1"></i>Add Legal Drafting
                </a>
            </div>
        </div>
        <!-- End Page Header -->

        <!-- Start Table -->
        <div class="table-responsive">
            <table id="legaldraftingTable" class="table table-striped table-bordered table-nowrap align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Sr. No.</th>
                        <th>Document Type</th>
                        <th>Template</th>
                        <th>Draft Editor</th>
                        <th>Version History</th>
                        <th>Reviewed By</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Document 1 -->
                    <tr>
                        <td>1</td>
                        <td>Contract</td>
                        <td>Service Agreement</td>
                        <td>Rich Text Editor</td>
                        <td>v1.0 → v1.2</td>
                        <td>Paralegal</td>
                        <td>
                            <span class="badge bg-warning-subtle text-warning border border-warning">Draft</span>
                        </td>
                        <td>
                            <div class="dropdown">
                                <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1" data-bs-toggle="dropdown">
                                    <i class="ti ti-dots-vertical"></i>
                                </a>
                                <ul class="dropdown-menu p-2">
                                    <li>
                                        <a href="legaldrafting-edit.php" class="dropdown-item">
                                            <i class="ti ti-edit me-2"></i>Edit
                                        </a>
                                    </li>
                                    <li>
                                        <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center text-success">
                                            <i class="ti ti-check me-2 text-success"></i>Approve
                                        </a>
                                    </li>
                                    <li>
                                        <a href="javascript:void(0);" class="dropdown-item text-danger delete-doc-btn" data-id="1">
                                            <i class="ti ti-trash me-2"></i>Delete
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </td>
                    </tr>

                    <!-- Document 2 -->
                    <tr>
                        <td>2</td>
                        <td>Will</td>
                        <td>Standard Will Format</td>
                        <td>HTML Editor</td>
                        <td>v1.0</td>
                        <td>Lawyer</td>
                        <td>
                            <span class="badge bg-success-subtle text-success border border-success">Approved</span>
                        </td>
                        <td>
                            <div class="dropdown">
                                <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1" data-bs-toggle="dropdown">
                                    <i class="ti ti-dots-vertical"></i>
                                </a>
                                <ul class="dropdown-menu p-2">
                                    <li>
                                        <a href="legaldrafting-edit.php" class="dropdown-item">
                                            <i class="ti ti-edit me-2"></i>Edit
                                        </a>
                                    </li>
                                    <li>
                                        <a href="javascript:void(0);" class="dropdown-item text-danger delete-doc-btn" data-id="2">
                                            <i class="ti ti-trash me-2"></i>Delete
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <!-- End Table -->

    </div>
    <!-- End Content -->

</div>

<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
<?php include ('footer.php'); ?>
<!-- Footer End -->

<!-- Delete Confirmation Script -->
<script>
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.delete-doc-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const docId = this.getAttribute('data-id');

            Swal.fire({
                title: 'Are you sure?',
                text: "This legal drafting record will be permanently deleted.",
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
                    // Redirect to delete page
                    window.location.href = '#delete-document.php?id=' + docId;
                }
            });
        });
    });
});
</script>
