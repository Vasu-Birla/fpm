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

    <!-- Start Page Header -->
    <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
        <div class="flex-grow-1">
            <h5 class="fw-bold mb-0">
                <a href="documentintake-list.php" class="text-dark"> <i class="ti ti-chevron-left me-1"></i>Document Intake List </a>
                <span class="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">Total : 10</span>
            </h5>
        </div>
        <div class="text-end d-flex">
            <a href="documentintake-create.php" class="btn btn-primary ms-2 fs-13 btn-md"><i class="ti ti-plus me-1"></i> Add Document Intake</a>
        </div>
    </div>
    <!-- End Page Header -->

    <div class="table-responsive">
        <table id="documentintakeTable" class="table table-striped table-bordered mb-0">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Client / Matter</th>
              <th>Document Name</th>
              <th>Type</th>
              <th>Remarks</th>
              <th>Sent to</th>
              <th>File</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>CASE-2025-009</td>
              <td>ID Copy</td>
              <td>ID</td>
              <td>Scanned at intake</td>
              <td>Paralegal</td>
              <td><a href="#">id_case2025.pdf</a></td>
              <td>
                <div class="d-flex align-items-center gap-1">
                    <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1" data-bs-toggle="dropdown">
                        <i class="ti ti-dots-vertical"></i>
                    </a>
                    <ul class="dropdown-menu p-2">
                        <li><a href="documentintake-edit.php" class="dropdown-item"><i class="ti ti-edit me-2"></i> Edit</a></li>
                        <li>
                            <a href="javascript:void(0);" class="dropdown-item text-danger delete-case-btn" data-id="1"><i class="ti ti-trash me-2"></i> Delete</a>
                        </li>
                    </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</div>
<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
  <?php include('footer.php'); ?>
<!-- Footer End -->

<script>
// Delete Client Record
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.delete-case-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();

            const caseId = this.getAttribute('data-id');

            Swal.fire({
                title: 'Are you sure?',
                text: "This document will be permanently deleted.",
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
                    window.location.href = '#delete-case.php?id=' + caseId;
                }
            });
        });
    });
});
</script>
