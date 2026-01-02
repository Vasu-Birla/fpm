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

    <!-- row start -->
    <div class="row justify-content-center">
      <div class="col-lg-12">
        <div class="page-header">
          <div class="row align-items-center">
            <div class="mb-4">
              <h5 class="fw-bold mb-0 d-flex align-items-center">
                <a href="evidence-list.php" class="text-dark">
                  <i class="ti ti-chevron-left me-1"></i>Edit Evidence
                </a>
              </h5>
            </div>
          </div>
        </div>

        <form action="#" method="post" enctype="multipart/form-data">
          <div class="card">
            <div class="card-body">
              <div class="row">

                <div class="col-md-6 mb-3">
                  <label for="exhibit_no" class="form-label">Exhibit No.</label>
                  <input type="text" id="exhibit_no" name="exhibit_no" class="form-control" value="EXH-001" required>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="date_collected" class="form-label">Date Collected</label>
                  <input type="date" id="date_collected" name="date_collected" class="form-control" value="2025-10-20" required>
                </div>

                <div class="col-md-12 mb-3">
                  <label for="description" class="form-label">Description</label>
                  <textarea id="description" name="description" class="form-control" rows="3" required>Example description of evidence...</textarea>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="source" class="form-label">Source</label>
                  <select id="source" name="source" class="form-select" required>
                    <option value="Client">Client</option>
                    <option value="Witness" selected>Witness</option>
                    <option value="Police">Police</option>
                  </select>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="stored_location" class="form-label">Stored Location</label>
                  <input type="text" id="stored_location" name="stored_location" class="form-control" value="Locker Room A-2" required>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="linked_case" class="form-label">Linked Case</label>
                  <input type="text" id="linked_case" name="linked_case" class="form-control" value="CASE-2025-009" required>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="chain_of_custody" class="form-label">Chain of Custody Upload (PDF)</label>
                  <input type="file" id="chain_of_custody" name="chain_of_custody" class="form-control" accept=".pdf" required>
                </div>

              </div>
            </div>
          </div>

          <div class="d-flex align-items-center justify-content-end">
            <a href="evidence-list.php" class="btn btn-light me-2">Cancel</a>
            <button type="submit" name="submit" class="btn btn-primary btn-md fs-13 fw-medium rounded">Update Evidence</button>
          </div>
        </form>

      </div>
    </div>
  </div>
</div>

<!-- Footer Start -->
    <?php include('footer.php'); ?>
<!-- Footer End -->
