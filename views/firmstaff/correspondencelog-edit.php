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
          <a href="correspondencelog-list.php" class="text-dark">
            <i class="ti ti-chevron-left me-1"></i>Edit Correspondence Log
          </a>
        </h5>
      </div>
    </div>

    <form action="#" method="POST" enctype="multipart/form-data" class="card">
      <input type="hidden" name="id" value="1">

      <div class="card-body">
        <div class="row g-3">

          <!-- Client -->
          <div class="col-md-6">
            <label for="client" class="form-label">Client</label>
            <select name="client" id="client" class="form-select" required>
              <option value="" disabled>Select Client</option>
              <option selected>John Doe</option>
            </select>
          </div>

          <!-- Date Sent -->
          <div class="col-md-6">
            <label for="date_sent" class="form-label">Date Sent</label>
            <input type="date" name="date_sent" id="date_sent" class="form-control" value="2025-10-20" required>
          </div>

          <!-- Method -->
          <div class="col-md-6">
            <label for="method" class="form-label">Method</label>
            <select name="method" id="method" class="form-select" required>
              <option value="" disabled>Select Method</option>
              <option selected>Email</option>
              <option>Letter</option>
              <option>Call</option>
            </select>
          </div>

          <!-- Summary -->
          <div class="col-md-12">
            <label for="summary" class="form-label">Summary</label>
            <textarea name="summary" id="summary" class="form-control" rows="3" placeholder="Enter brief summary..." required>Sent initial engagement email</textarea>
          </div>

          <!-- Uploaded File -->
          <div class="col-md-6">
            <label for="upload_file" class="form-label">Uploaded File</label>
            <input type="file" name="upload_file" id="upload_file" class="form-control" accept=".pdf,.txt,.docx" placeholder="Upload new file if needed">
            <small class="text-muted d-block mt-1">Current: email_2025_10_20.pdf</small>
          </div>

          <!-- Follow-up Required -->
          <div class="col-md-6">
            <label for="follow_up" class="form-label">Follow-up Required</label>
            <select name="follow_up" id="follow_up" class="form-select" required>
              <option value="" disabled>Select Option</option>
              <option>No</option>
              <option selected>Yes</option>
            </select>
          </div>

        </div>
      </div>

      <div class="card-footer d-flex justify-content-end">
        <a href="correspondencelog-list.php" class="btn btn-light me-2">Cancel</a>
        <button type="submit" class="btn btn-primary">Update Log</button>
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
