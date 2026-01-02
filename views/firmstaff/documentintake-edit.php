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
    <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-bottom">
      <div class="flex-grow-1">
        <h5 class="fw-bold mb-0">
          <a href="documentintake-list.php" class="text-dark">
            <i class="ti ti-chevron-left me-1"></i>Edit Document Intake
          </a>
        </h5>
      </div>
    </div>

    <form action="#" method="POST" enctype="multipart/form-data" class="card">
      <input type="hidden" name="id" value="1">

      <div class="card-body">
        <div class="row g-3">

          <div class="col-md-6">
            <label for="client_matter" class="form-label">Client / Matter</label>
            <input type="text" id="client_matter" name="client_matter" class="form-control" value="CASE-2025-009" placeholder="Enter client name or matter ID" required>
          </div>

          <div class="col-md-6">
            <label for="document_name" class="form-label">Document Name</label>
            <input type="text" id="document_name" name="document_name" class="form-control" value="ID Copy" placeholder="Enter document title" required>
          </div>

          <div class="col-md-6">
            <label for="document_file" class="form-label">Upload</label>
            <input type="file" id="document_file" name="document_file" class="form-control" accept=".pdf,.doc,.docx,.jpg,.png" placeholder="Upload new document (optional)">
            <small class="text-muted d-block mt-1">Current: id_case2025.pdf</small>
          </div>

          <div class="col-md-6">
            <label for="document_type" class="form-label">Document Type</label>
            <select id="document_type" name="document_type" class="form-select" required>
              <option value="">Select document type</option>
              <option value="ID" selected>ID</option>
              <option value="Evidence">Evidence</option>
              <option value="Statement">Statement</option>
            </select>
          </div>

          <div class="col-md-12">
            <label for="remarks" class="form-label">Remarks</label>
            <textarea id="remarks" name="remarks" class="form-control" rows="3" placeholder="Enter remarks or comments">Received from client at intake counter.</textarea>
          </div>

          <div class="col-md-6">
            <label for="sent_to" class="form-label">Sent To</label>
            <select id="sent_to" name="sent_to" class="form-select" required>
              <option value="">Select recipient</option>
              <option value="Lawyer">Lawyer</option>
              <option value="Paralegal" selected>Paralegal</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

        </div>
      </div>

      <div class="card-footer d-flex justify-content-end">
        <a href="documentintake-list.php" class="btn btn-light me-2">Cancel</a>
        <button type="submit" class="btn btn-primary">Update Document</button>
      </div>
    </form>

  </div>
</div>
<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
<?php include('footer.php'); ?>
<!-- Footer End -->
