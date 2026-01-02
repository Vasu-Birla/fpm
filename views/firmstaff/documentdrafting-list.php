<!-- Header Start -->
    <?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
    <?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<div class="page-wrapper">
    <div class="content">

        <!-- Page Header -->
        <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-bottom">
            <div class="flex-grow-1">
                <h5 class="fw-bold mb-0">
                    <a href="documentdrafting-list.php" class="text-dark"><i class="ti ti-chevron-left me-1"></i>Document Drafting List </a> 
                    <span class="badge badge-soft-primary border py-1 px-2 border-primary fs-13 ms-1">Total Document Drafting: 6</span>
                </h5>
            </div>
            <div class="text-end">
                <a href="documentdrafting-create.php" class="btn btn-primary"><i class="ti ti-plus me-1"></i>Add Document Drafting</a>
            </div>
        </div>

        <!-- Table Start -->
        <div class="table-responsive">
            <table id="documentdraftingTable" class="table table-striped table-bordered align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Sr. No.</th>
                        <th>Linked Matter</th>
                        <th>Document Name</th>
                        <th>Template</th>
                        <th>Version Comment</th>
                        <th>Sent for Review</th>
                        <th>Uploaded File</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>Case #001 - Property Dispute</td>
                        <td>Lease Agreement Draft</td>
                        <td>Standard</td>
                        <td>Initial draft created.</td>
                        <td><span class="badge bg-success-subtle text-success border border-success">Yes</span></td>
                        <td><a href="#uploads/lease-agreement.pdf" target="_blank" class="text-primary"><i class="ti ti-file-text"></i> View</a></td>
                        <td><span class="badge bg-success-subtle text-success border border-success">Active</span></td>
                        <td>
                            <div class="dropdown">
                                <a href="javascript:void(0);" data-bs-toggle="dropdown" class="shadow-sm border rounded-2 p-1 d-inline-flex"><i class="ti ti-dots-vertical"></i></a>
                                <ul class="dropdown-menu p-2">
                                    <li><a href="documentdrafting-edit.php" class="dropdown-item"><i class="ti ti-edit me-2"></i>Edit</a></li>
                                    <li><a href="javascript:void(0);" class="dropdown-item text-danger delete-btn" data-id="1"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>Case #002 - Contract Review</td>
                        <td>Employment Agreement</td>
                        <td>Firm</td>
                        <td>Revised version for HR review.</td>
                        <td><span class="badge bg-warning-subtle text-warning border border-warning">No</span></td>
                        <td><a href="#uploads/employment-agreement.docx" target="_blank" class="text-primary"><i class="ti ti-file-text"></i> View</a></td>
                        <td><span class="badge bg-warning-subtle text-warning border border-warning">Pending</span></td>
                        <td>
                            <div class="dropdown">
                                <a href="javascript:void(0);" data-bs-toggle="dropdown" class="shadow-sm border rounded-2 p-1 d-inline-flex"><i class="ti ti-dots-vertical"></i></a>
                                <ul class="dropdown-menu p-2">
                                    <li><a href="documentdrafting-edit.php" class="dropdown-item"><i class="ti ti-edit me-2"></i>Edit</a></li>
                                    <li><a href="javascript:void(0);" class="dropdown-item text-danger delete-btn" data-id="2"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <!-- Table End -->

    </div>
</div>

<!-- Footer Start -->
    <?php include('footer.php'); ?>
<!-- Footer End -->

<script>
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.delete-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            Swal.fire({
                title: 'Are you sure?',
                text: "This document drafting will be permanently deleted.",
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
                    window.location.href = '#delete-document.php?id=' + id;
                }
            });
        });
    });
});
</script>
