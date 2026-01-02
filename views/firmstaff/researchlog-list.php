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
    <div class="content">

        <!-- Page Header -->
        <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div class="flex-grow-1">
                <h5 class="fw-bold mb-0">
                    <a href="researchlog-list.php" class="text-dark"> <i class="ti ti-chevron-left me-1"></i>Research Log List </a>
                    <span class="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1"> Total Research Logs : 8 </span>
                </h5>
            </div>
            <div class="text-end d-flex">
                <a href="researchlog-create.php" class="btn btn-primary ms-2 fs-13 btn-md">
                    <i class="ti ti-plus me-1"></i>Add Research Log
                </a>
            </div>
        </div>

        <!-- Table -->
        <div class="table-responsive">
            <table id="researchlogTable" class="table table-striped table-bordered table-nowrap align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Sr. No.</th>
                        <th>Research Title</th>
                        <th>Case Citation / Statute</th>
                        <th>Summary</th>
                        <th>Tags</th>
                        <th>Linked Matter</th>
                        <th>Reference</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Row 1 -->
                    <tr>
                        <td>1</td>
                        <td>Contractual Obligations under UAE Law</td>
                        <td>UAE Civil Code Art. 129</td>
                        <td>Analysis of key obligations and remedies for breach under UAE law.</td>
                        <td><span class="badge bg-info-subtle text-info border border-info">Contract</span></td>
                        <td>Case #1088 - Contract Breach</td>
                        <td>
                            <a href="#uploads/research1.pdf" target="_blank" class="text-primary">
                                <i class="ti ti-file-text me-1"></i>View
                            </a>
                        </td>
                        <td>
                            <div class="dropdown">
                                <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1" data-bs-toggle="dropdown">
                                    <i class="ti ti-dots-vertical"></i>
                                </a>
                                <ul class="dropdown-menu p-2">
                                    <li>
                                        <a href="researchlog-edit.php" class="dropdown-item">
                                            <i class="ti ti-edit me-2"></i>Edit
                                        </a>
                                    </li>
                                    <li>
                                        <a href="javascript:void(0);" class="dropdown-item text-danger delete-research-btn" data-id="1">
                                            <i class="ti ti-trash me-2"></i>Delete
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </td>
                    </tr>

                    <!-- Row 2 -->
                    <tr>
                        <td>2</td>
                        <td>Doctrine of Res Judicata</td>
                        <td>CPC Section 11</td>
                        <td>Summary of case laws supporting principle of finality of judgments.</td>
                        <td><span class="badge bg-secondary-subtle text-secondary border border-secondary">Litigation</span></td>
                        <td>Case #1024 - Property Dispute</td>
                        <td>
                            <a href="#uploads/research2.pdf" target="_blank" class="text-primary">
                                <i class="ti ti-file-text me-1"></i>View
                            </a>
                        </td>
                        <td>
                            <div class="dropdown">
                                <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1" data-bs-toggle="dropdown">
                                    <i class="ti ti-dots-vertical"></i>
                                </a>
                                <ul class="dropdown-menu p-2">
                                    <li>
                                        <a href="researchlog-edit.php" class="dropdown-item">
                                            <i class="ti ti-edit me-2"></i>Edit
                                        </a>
                                    </li>
                                    <li>
                                        <a href="javascript:void(0);" class="dropdown-item text-danger delete-research-btn" data-id="2">
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
</div>

<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
    <?php include ('footer.php'); ?>
<!-- Footer End -->

<!-- Delete Confirmation -->
<script>
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.delete-research-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const researchId = this.getAttribute('data-id');

            Swal.fire({
                title: 'Are you sure?',
                text: "This research log will be permanently deleted.",
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
                    window.location.href = '#delete-research.php?id=' + researchId;
                }
            });
        });
    });
});
</script>
